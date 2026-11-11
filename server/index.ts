import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { WebSocketServer, type WebSocket } from "ws";
import {
  DEFAULT_HTTP_PORT,
  LOCAL_ORIGIN_RE,
  type ClientRole,
  type ClientToServerMessage,
  type InputMessage,
  type ServerToClientMessage,
} from "../shared/protocol.ts";
import {
  DEFAULT_SETTINGS,
  mergeSettings,
  type OverlaySettings,
} from "../shared/settings.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DATA_DIR = join(ROOT, "data");
const SETTINGS_PATH = join(DATA_DIR, "settings.json");
const TOKEN_PATH = join(DATA_DIR, "local-token.txt");
const DIST_DIR = join(ROOT, "dist");
const PORT = Number(process.env.PORT || DEFAULT_HTTP_PORT);

mkdirSync(DATA_DIR, { recursive: true });

function loadOrCreateToken(): string {
  if (existsSync(TOKEN_PATH)) {
    return readFileSync(TOKEN_PATH, "utf8").trim();
  }
  const token = `local-${randomBytes(16).toString("hex")}`;
  writeFileSync(TOKEN_PATH, token, "utf8");
  return token;
}

function loadSettings(): OverlaySettings {
  if (!existsSync(SETTINGS_PATH)) {
    writeFileSync(SETTINGS_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2));
    return structuredClone(DEFAULT_SETTINGS);
  }
  try {
    const raw = JSON.parse(readFileSync(SETTINGS_PATH, "utf8")) as Partial<OverlaySettings>;
    return mergeSettings(raw);
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

function saveSettings(settings: OverlaySettings): void {
  writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

const localToken = loadOrCreateToken();
let settings = loadSettings();
let capturePaused = false;
let lastInputAt: number | null = null;

interface SockMeta {
  role: ClientRole | null;
  authed: boolean;
}

const meta = new WeakMap<WebSocket, SockMeta>();

const app = express();
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || LOCAL_ORIGIN_RE.test(origin)) {
        cb(null, true);
        return;
      }
      cb(new Error("Non-local origin blocked"));
    },
  }),
);
app.use(express.json({ limit: "256kb" }));

app.get("/api/health", (_req, res) => {
  const companionConnected = wss
    ? [...wss.clients].some((c) => meta.get(c)?.role === "companion")
    : false;
  res.json({
    ok: true,
    bind: "127.0.0.1",
    capturePaused,
    companionConnected,
    lastInputAt,
    overlayClients: wss
      ? [...wss.clients].filter((c) => meta.get(c)?.role === "overlay" && meta.get(c)?.authed)
          .length
      : 0,
  });
});

app.get("/api/token", (req, res) => {
  const origin = req.get("origin") || "";
  const host = req.hostname;
  if (host !== "127.0.0.1" && host !== "localhost") {
    res.status(403).json({ error: "loopback only" });
    return;
  }
  if (origin && !LOCAL_ORIGIN_RE.test(origin)) {
    res.status(403).json({ error: "local origin only" });
    return;
  }
  res.json({
    token: localToken,
    note: "Local loopback convenience token — not internet auth.",
  });
});

app.get("/api/settings", (_req, res) => {
  res.json(settings);
});

app.put("/api/settings", (req, res) => {
  settings = mergeSettings(req.body as Partial<OverlaySettings>);
  saveSettings(settings);
  broadcast({ type: "settings-updated" });
  res.json(settings);
});

app.post("/api/settings/reset", (_req, res) => {
  settings = structuredClone(DEFAULT_SETTINGS);
  saveSettings(settings);
  broadcast({ type: "settings-updated" });
  res.json(settings);
});

if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/ws")) {
      next();
      return;
    }
    const fallback = join(DIST_DIR, "index.html");
    if (existsSync(fallback)) {
      res.sendFile(fallback);
      return;
    }
    next();
  });
} else {
  app.get("/", (_req, res) => {
    res.type("html").send(`<!doctype html>
<html><body style="font-family:monospace;background:#1a1c18;color:#c4b59a;padding:2rem">
<h1>Zone Overlay server</h1>
<p>No <code>dist/</code> yet. Run <code>npm run dev</code> (Vite on :5173) or <code>npm run preview</code>.</p>
<p>API/WS bound to 127.0.0.1:${PORT}</p>
</body></html>`);
  });
}

const server = createServer(app);
let wss: WebSocketServer;
wss = new WebSocketServer({
  server,
  path: "/ws",
  // Accept only connections that will authenticate via hello + local checks.
});

function send(ws: WebSocket, msg: ServerToClientMessage): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcast(msg: ServerToClientMessage, filter?: (ws: WebSocket) => boolean): void {
  for (const client of wss.clients) {
    if (client.readyState !== client.OPEN) continue;
    const m = meta.get(client);
    if (!m?.authed) continue;
    if (filter && !filter(client)) continue;
    send(client, msg);
  }
}

function statusPayload(): ServerToClientMessage {
  const companionConnected = [...wss.clients].some(
    (c) => meta.get(c)?.role === "companion" && meta.get(c)?.authed,
  );
  const overlayClients = [...wss.clients].filter(
    (c) => meta.get(c)?.role === "overlay" && meta.get(c)?.authed,
  ).length;
  return {
    type: "status",
    capturePaused,
    companionConnected,
    overlayClients,
    lastInputAt,
    demoModeHint:
      "Demo mode is dashboard-local only and never reports as a live companion connection.",
  };
}

function broadcastStatus(): void {
  broadcast(statusPayload());
}

wss.on("connection", (ws, req) => {
  meta.set(ws, { role: null, authed: false });

  // Streamlabs/OBS CEF often omits Origin or sends null — allow empty.
  // Only block clearly non-loopback Origins.
  const origin = req.headers.origin || "";
  if (origin && origin !== "null" && !LOCAL_ORIGIN_RE.test(origin)) {
    send(ws, {
      type: "error",
      code: "origin_blocked",
      message: "Only localhost/127.0.0.1 origins are accepted.",
    });
    ws.close();
    return;
  }

  // Companion / Streamlabs overlays / test clients: hello + token required.
  ws.on("message", (raw) => {
    let msg: ClientToServerMessage;
    try {
      msg = JSON.parse(String(raw)) as ClientToServerMessage;
    } catch {
      send(ws, { type: "error", code: "bad_json", message: "Invalid JSON" });
      return;
    }

    const state = meta.get(ws);
    if (!state) return;

    if (msg.type === "hello") {
      if (msg.token !== localToken) {
        send(ws, {
          type: "error",
          code: "bad_token",
          message: "Local token mismatch. Fetch /api/token from loopback.",
        });
        ws.close();
        return;
      }
      state.role = msg.role;
      state.authed = true;
      send(ws, statusPayload());
      broadcastStatus();
      return;
    }

    if (!state.authed) {
      send(ws, { type: "error", code: "unauthed", message: "Send hello first" });
      return;
    }

    switch (msg.type) {
      case "ping":
        send(ws, { type: "pong" });
        break;
      case "pause":
        capturePaused = true;
        broadcast({ type: "reset-idle", reason: "pause" });
        broadcastStatus();
        break;
      case "resume":
        capturePaused = false;
        broadcastStatus();
        break;
      case "input": {
        if (state.role !== "companion" && state.role !== "test") {
          send(ws, {
            type: "error",
            code: "role",
            message: "Only companion/test may send input",
          });
          break;
        }
        if (capturePaused) break;
        lastInputAt = Date.now();
        const forward: InputMessage = {
          type: "input",
          kind: msg.kind,
          phase: msg.phase,
          pressId: msg.pressId,
          held: msg.held,
        };
        if (typeof msg.slot === "number" && Number.isFinite(msg.slot)) {
          forward.slot = Math.max(0, Math.min(63, Math.floor(msg.slot)));
        }
        if (msg.kind === "mouseMove") {
          const dx = Number(msg.dx);
          const dy = Number(msg.dy);
          if (Number.isFinite(dx)) forward.dx = Math.max(-24, Math.min(24, dx));
          if (Number.isFinite(dy)) forward.dy = Math.max(-24, Math.min(24, dy));
        }
        broadcast(forward, (c) => {
          const r = meta.get(c)?.role;
          return r === "overlay" || r === "dashboard";
        });
        break;
      }
      case "mic": {
        // Levels only — dashboard (Web Audio) or companion may publish.
        if (
          state.role !== "dashboard" &&
          state.role !== "companion" &&
          state.role !== "test"
        ) {
          send(ws, {
            type: "error",
            code: "role",
            message: "Only dashboard/companion/test may send mic levels",
          });
          break;
        }
        const level = Math.max(0, Math.min(1, Number(msg.level) || 0));
        broadcast(
          { type: "mic", level, talking: !!msg.talking },
          (c) => meta.get(c)?.role === "overlay" || meta.get(c)?.role === "dashboard",
        );
        break;
      }
      case "chat-line": {
        if (state.role !== "dashboard" && state.role !== "test") {
          send(ws, {
            type: "error",
            code: "role",
            message: "Only dashboard/test may send chat lines",
          });
          break;
        }
        const text = String(msg.text || "").trim().slice(0, 160);
        if (!text) break;
        broadcast(
          {
            type: "chat-line",
            text,
            from: msg.from === "demo" ? "demo" : "dashboard",
          },
          (c) => meta.get(c)?.role === "overlay" || meta.get(c)?.role === "dashboard",
        );
        break;
      }
      case "atm-preview": {
        if (state.role !== "dashboard" && state.role !== "test") {
          send(ws, {
            type: "error",
            code: "role",
            message: "Only dashboard/test may preview atmosphere",
          });
          break;
        }
        const kind = String(msg.kind || "");
        const allowed = new Set(["flicker", "smoke", "sparks", "follow", "sub"]);
        if (!allowed.has(kind)) break;
        broadcast(
          { type: "atm-preview", kind: kind as "flicker" | "smoke" | "sparks" | "follow" | "sub" },
          (c) => meta.get(c)?.role === "overlay",
        );
        break;
      }
      default: {
        const _exhaustive: never = msg;
        void _exhaustive;
        break;
      }
    }
  });

  ws.on("close", () => {
    const state = meta.get(ws);
    if (state?.role === "companion" || state?.role === "test") {
      broadcast({ type: "reset-idle", reason: "disconnect" });
    }
    broadcastStatus();
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Zone overlay server on http://127.0.0.1:${PORT}`);
  console.log(`WebSocket         ws://127.0.0.1:${PORT}/ws`);
  console.log(`Local token file  ${TOKEN_PATH}`);
  if (!existsSync(DIST_DIR)) {
    console.log("Tip: npm run dev  → Vite :5173 proxies /api and /ws here");
  }
});
