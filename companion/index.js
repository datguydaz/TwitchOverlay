/**
 * Zone Overlay input companion (Windows-first).
 *
 * Captures global keyboard/mouse via uiohook-napi (libuiohook) and forwards
 * minimal animation signals to ws://127.0.0.1:8787/ws
 *
 * Does NOT: record text, send key names/characters, inject input, hook game
 * processes, or transmit off-machine.
 *
 * Run on Windows after `npm install` in this folder.
 * On non-Windows hosts this process exits with a clear message — use
 * scripts/test-protocol.ts for protocol verification on Linux CI/VMs.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import WebSocket from "ws";

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

/** Opaque press tracking — never stores keycodes or characters on the wire. */
let nextPressId = 1;
const keyDownIds = new Map(); // uiohook keycode -> pressId (local only)
let keyHeld = 0;
let mouseLHeld = 0;
let mouseRHeld = 0;
let mouseLPressId = 0;
let mouseRPressId = 0;
let capturePaused = false;
let uio = null;

function send(ws, obj) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}

function emitInput(ws, kind, phase, pressId, held) {
  send(ws, { type: "input", kind, phase, pressId, held });
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

function attachHooks(ws, uiohook) {
  const { uIOhook, UiohookKey } = uiohook;
  void UiohookKey;
  uio = uIOhook;

  uIOhook.on("keydown", (e) => {
    if (capturePaused) return;
    if (keyDownIds.has(e.keycode)) return; // ignore OS repeat; keep pose stable
    const pressId = nextPressId++;
    keyDownIds.set(e.keycode, pressId);
    keyHeld += 1;
    emitInput(ws, "key", "down", pressId, keyHeld);
  });

  uIOhook.on("keyup", (e) => {
    if (capturePaused) return;
    const pressId = keyDownIds.get(e.keycode);
    if (pressId == null) return;
    keyDownIds.delete(e.keycode);
    keyHeld = Math.max(0, keyHeld - 1);
    emitInput(ws, "key", "up", pressId, keyHeld);
  });

  uIOhook.on("mousedown", (e) => {
    if (capturePaused) return;
    // uiohook button: 1 left, 2 right, 3 middle (per library docs)
    if (e.button === 1) {
      mouseLPressId = nextPressId++;
      mouseLHeld = 1;
      emitInput(ws, "mouseL", "down", mouseLPressId, mouseLHeld);
    } else if (e.button === 2) {
      mouseRPressId = nextPressId++;
      mouseRHeld = 1;
      emitInput(ws, "mouseR", "down", mouseRPressId, mouseRHeld);
    }
  });

  uIOhook.on("mouseup", (e) => {
    if (capturePaused) return;
    if (e.button === 1) {
      mouseLHeld = 0;
      emitInput(ws, "mouseL", "up", mouseLPressId || nextPressId++, 0);
    } else if (e.button === 2) {
      mouseRHeld = 0;
      emitInput(ws, "mouseR", "up", mouseRPressId || nextPressId++, 0);
    }
  });

  uIOhook.start();
  console.log("uIOhook started (pass-through capture; no injection).");
}

function resetLocalHeld() {
  keyDownIds.clear();
  keyHeld = 0;
  mouseLHeld = 0;
  mouseRHeld = 0;
}

function connect() {
  const token = loadToken();
  const ws = new WebSocket(WS_URL, {
    origin: "http://127.0.0.1:8787",
  });

  ws.on("open", () => {
    console.log(`Connected ${WS_URL}`);
    send(ws, { type: "hello", role: "companion", token });
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
        `Status: capture=${capturePaused ? "paused" : "active"} overlays=${msg.overlayClients}`,
      );
    }
    if (msg.type === "error") {
      console.error("Server error:", msg.code, msg.message);
    }
  });

  ws.on("close", () => {
    console.warn("Disconnected — will retry. Avatar should return to idle.");
    resetLocalHeld();
    try {
      uio?.stop();
    } catch {
      /* ignore */
    }
    setTimeout(connect, 1000);
  });

  ws.on("error", (err) => {
    console.error("WS error:", err.message);
  });

  return ws;
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
  const ws = connect();

  // Wait for open before hooks so early taps are not lost silently without socket
  ws.on("open", () => {
    attachHooks(ws, uiohook);
  });

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  console.log("Commands: p = pause, r = resume, q = quit");
  rl.on("line", (line) => {
    const cmd = line.trim().toLowerCase();
    if (cmd === "p") {
      capturePaused = true;
      resetLocalHeld();
      send(ws, { type: "pause" });
      console.log("Capture paused");
    } else if (cmd === "r") {
      capturePaused = false;
      send(ws, { type: "resume" });
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
