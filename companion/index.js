/**
 * Zone Overlay input companion (Windows-first).
 *
 * Captures global keyboard/mouse via uiohook-napi (libuiohook) and forwards
 * minimal animation signals to ws://127.0.0.1:8787/ws
 *
 * Does NOT: record text, send key names/characters, inject input, hook game
 * processes, or transmit off-machine.
 *
 * Critical: hooks stay attached across WS reconnects so Streamlabs/game focus
 * never kills input — only the socket is replaced.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import WebSocket from "ws";
import { slotFromKeycode } from "./keyGrid.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const TOKEN_PATH = resolve(ROOT, "data/local-token.txt");
const WS_URL = process.env.ZONE_WS_URL || "ws://127.0.0.1:8787/ws";

const isWin = process.platform === "win32";

function loadToken() {
  if (process.env.ZONE_LOCAL_TOKEN) return process.env.ZONE_LOCAL_TOKEN;
  if (!existsSync(TOKEN_PATH)) {
    console.error(
      `Missing ${TOKEN_PATH}. Start the overlay server once so it can mint a local token.`,
    );
    process.exit(1);
  }
  return readFileSync(TOKEN_PATH, "utf8").trim();
}

let nextPressId = 1;
const keyDownIds = new Map();
let keyHeld = 0;
let mouseLHeld = 0;
let mouseRHeld = 0;
let mouseLPressId = 0;
let mouseRPressId = 0;
let capturePaused = false;
let uio = null;
let hooksAttached = false;
/** Always point emits at the live socket (survives reconnect). */
let activeWs = null;
let reconnectTimer = null;
let pingTimer = null;

function send(obj) {
  if (activeWs && activeWs.readyState === WebSocket.OPEN) {
    activeWs.send(JSON.stringify(obj));
  }
}

function emitInput(kind, phase, pressId, held, slot, extra) {
  const msg = { type: "input", kind, phase, pressId, held };
  if (typeof slot === "number") msg.slot = slot;
  if (extra && typeof extra === "object") Object.assign(msg, extra);
  send(msg);
}

async function loadUiohook() {
  try {
    return await import("uiohook-napi");
  } catch (err) {
    console.error("Failed to load uiohook-napi:", err.message);
    console.error(
      "Install native deps on Windows (`npm install` in companion/). See companion/README.md.",
    );
    process.exit(1);
  }
}

function attachHooks(uiohook) {
  if (hooksAttached) return;
  const { uIOhook } = uiohook;
  uio = uIOhook;

  uIOhook.on("keydown", (e) => {
    if (capturePaused) return;
    if (keyDownIds.has(e.keycode)) return;
    const pressId = nextPressId++;
    const slot = slotFromKeycode(e.keycode);
    keyDownIds.set(e.keycode, { pressId, slot });
    keyHeld += 1;
    emitInput("key", "down", pressId, keyHeld, slot);
  });

  uIOhook.on("keyup", (e) => {
    if (capturePaused) return;
    const entry = keyDownIds.get(e.keycode);
    if (entry == null) return;
    keyDownIds.delete(e.keycode);
    keyHeld = Math.max(0, keyHeld - 1);
    emitInput("key", "up", entry.pressId, keyHeld, entry.slot);
  });

  uIOhook.on("mousedown", (e) => {
    if (capturePaused) return;
    if (e.button === 1) {
      mouseLPressId = nextPressId++;
      mouseLHeld = 1;
      emitInput("mouseL", "down", mouseLPressId, mouseLHeld);
    } else if (e.button === 2) {
      mouseRPressId = nextPressId++;
      mouseRHeld = 1;
      emitInput("mouseR", "down", mouseRPressId, mouseRHeld);
    }
  });

  uIOhook.on("mouseup", (e) => {
    if (capturePaused) return;
    if (e.button === 1) {
      mouseLHeld = 0;
      emitInput("mouseL", "up", mouseLPressId || nextPressId++, 0);
    } else if (e.button === 2) {
      mouseRHeld = 0;
      emitInput("mouseR", "up", mouseRPressId || nextPressId++, 0);
    }
  });

  // Mouse move: relative deltas only (derive from x/y; never send absolute coords).
  let moveAccX = 0;
  let moveAccY = 0;
  let lastMoveX = null;
  let lastMoveY = null;
  let lastMoveEmitAt = 0;
  let moveFlushTimer = null;
  const flushMouseMove = () => {
    moveFlushTimer = null;
    if (capturePaused) {
      moveAccX = 0;
      moveAccY = 0;
      return;
    }
    const dx = Math.max(-24, Math.min(24, Math.round(moveAccX)));
    const dy = Math.max(-24, Math.min(24, Math.round(moveAccY)));
    moveAccX = 0;
    moveAccY = 0;
    if (dx === 0 && dy === 0) return;
    emitInput("mouseMove", "down", nextPressId++, 0, undefined, { dx, dy });
  };
  uIOhook.on("mousemove", (e) => {
    if (capturePaused) return;
    const x = typeof e.x === "number" ? e.x : null;
    const y = typeof e.y === "number" ? e.y : null;
    if (x == null || y == null) return;
    if (lastMoveX == null || lastMoveY == null) {
      lastMoveX = x;
      lastMoveY = y;
      return;
    }
    const dx = x - lastMoveX;
    const dy = y - lastMoveY;
    lastMoveX = x;
    lastMoveY = y;
    if (dx === 0 && dy === 0) return;
    moveAccX += dx;
    moveAccY += dy;
    const now = Date.now();
    if (now - lastMoveEmitAt >= 40) {
      lastMoveEmitAt = now;
      flushMouseMove();
    } else if (moveFlushTimer == null) {
      moveFlushTimer = setTimeout(flushMouseMove, 40);
    }
  });

  // Wheel: only up/down pulse — never log rotation amount, position, or page content
  let lastWheelAt = 0;
  uIOhook.on("wheel", (e) => {
    if (capturePaused) return;
    const now = Date.now();
    if (now - lastWheelAt < 45) return;
    lastWheelAt = now;
    // uiohook reports rotation (+/- clicks). Fall back to amount sign if rotation is 0.
    const rot =
      typeof e.rotation === "number" && e.rotation !== 0
        ? e.rotation
        : typeof e.amount === "number"
          ? e.amount
          : 0;
    if (rot === 0) return;
    // Negative rotation ≈ scroll up on Windows libuiohook
    const kind = rot < 0 ? "wheelUp" : "wheelDown";
    const pressId = nextPressId++;
    emitInput(kind, "down", pressId, 1);
  });

  uIOhook.start();
  hooksAttached = true;
  console.log("uIOhook started (pass-through capture; no injection). Survives WS reconnect.");
}

function resetLocalHeld() {
  keyDownIds.clear();
  keyHeld = 0;
  mouseLHeld = 0;
  mouseRHeld = 0;
}

function clearReconnect() {
  if (reconnectTimer != null) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function startPing() {
  if (pingTimer != null) clearInterval(pingTimer);
  pingTimer = setInterval(() => send({ type: "ping" }), 15000);
}

function connect(uiohook) {
  clearReconnect();
  const token = loadToken();
  console.log(`Connecting ${WS_URL} …`);
  const ws = new WebSocket(WS_URL, {
    origin: "http://127.0.0.1:8787",
  });
  activeWs = ws;

  ws.on("open", () => {
    console.log(`Connected ${WS_URL}`);
    send({ type: "hello", role: "companion", token });
    attachHooks(uiohook);
    startPing();
  });

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }
    if (msg.type === "status") {
      capturePaused = !!msg.capturePaused;
      console.log(
        `Status: capture=${capturePaused ? "paused" : "active"} overlays=${msg.overlayClients} lastInput=${msg.lastInputAt ?? "none"}`,
      );
    }
    if (msg.type === "error") {
      console.error("Server error:", msg.code, msg.message);
    }
  });

  ws.on("close", () => {
    console.warn("Disconnected — retrying. Hooks stay hot; avatar should idle until reconnect.");
    if (activeWs === ws) activeWs = null;
    resetLocalHeld();
    if (pingTimer != null) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
    // Do NOT stop uiohook — Streamlabs/game focus must keep working after reconnect.
    reconnectTimer = setTimeout(() => connect(uiohook), 1000);
  });

  ws.on("error", (err) => {
    console.error("WS error:", err.message);
  });
}

async function main() {
  console.log("Zone Overlay companion");
  console.log("Bind target: 127.0.0.1 only (server-side). No off-machine transmit.");

  if (!isWin) {
    console.error(
      `\nThis companion's global hooks require Windows (current: ${process.platform}).`,
    );
    console.error(
      "Use `npm run test:protocol` on this machine to verify WS protocol, pause/resume, and reconnect.",
    );
    console.error("Run `npm start` inside companion/ on a Windows streaming PC.\n");
    process.exit(2);
  }

  const uiohook = await loadUiohook();
  connect(uiohook);

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  console.log("Commands: p = pause, r = resume, q = quit");
  rl.on("line", (line) => {
    const cmd = line.trim().toLowerCase();
    if (cmd === "p") {
      capturePaused = true;
      resetLocalHeld();
      send({ type: "pause" });
      console.log("Capture paused");
    } else if (cmd === "r") {
      capturePaused = false;
      send({ type: "resume" });
      console.log("Capture resumed");
    } else if (cmd === "q") {
      try {
        uio?.stop();
      } catch {
        /* ignore */
      }
      process.exit(0);
    }
  });
}

void main();
