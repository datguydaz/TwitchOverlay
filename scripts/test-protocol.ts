/**
 * Local protocol verification (Linux/CI safe).
 * Does NOT claim Windows global hooks were exercised.
 */
import WebSocket from "ws";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PORT = Number(process.env.PORT || 8787);
const BASE = `http://127.0.0.1:${PORT}`;
const WS_URL = `ws://127.0.0.1:${PORT}/ws`;

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function wait(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

function onceMessage(ws: WebSocket, pred: (msg: Record<string, unknown>) => boolean, ms = 3000) {
  return new Promise<Record<string, unknown>>((resolveP, reject) => {
    const t = setTimeout(() => reject(new Error("timeout waiting for message")), ms);
    const onMsg = (raw: WebSocket.RawData) => {
      const msg = JSON.parse(String(raw)) as Record<string, unknown>;
      if (pred(msg)) {
        clearTimeout(t);
        ws.off("message", onMsg);
        resolveP(msg);
      }
    };
    ws.on("message", onMsg);
  });
}

async function main(): Promise<void> {
  const health = await fetch(`${BASE}/api/health`);
  assert(health.ok, "health failed — is the server running on 127.0.0.1:8787?");
  const healthJson = (await health.json()) as { bind?: string };
  console.log("health:", healthJson);

  const tokenRes = await fetch(`${BASE}/api/token`);
  assert(tokenRes.ok, "token endpoint failed");
  const { token } = (await tokenRes.json()) as { token: string };
  assert(token.startsWith("local-"), "token shape");

  if (existsSync(resolve(ROOT, "data/local-token.txt"))) {
    const fileToken = readFileSync(resolve(ROOT, "data/local-token.txt"), "utf8").trim();
    assert(fileToken === token, "file token matches API");
  }

  const overlay = new WebSocket(WS_URL, { origin: "http://127.0.0.1:5173" });
  await new Promise<void>((res, rej) => {
    overlay.once("open", () => res());
    overlay.once("error", rej);
  });
  overlay.send(JSON.stringify({ type: "hello", role: "overlay", token }));
  await onceMessage(overlay, (m) => m.type === "status");

  const companion = new WebSocket(WS_URL, { origin: "http://127.0.0.1:8787" });
  await new Promise<void>((res, rej) => {
    companion.once("open", () => res());
    companion.once("error", rej);
  });
  companion.send(JSON.stringify({ type: "hello", role: "test", token }));
  await onceMessage(companion, (m) => m.type === "status");

  // Input fan-out
  const inputPromise = onceMessage(
    overlay,
    (m) => m.type === "input" && m.kind === "key" && m.phase === "down",
  );
  companion.send(
    JSON.stringify({ type: "input", kind: "key", phase: "down", pressId: 1, held: 1 }),
  );
  const got = await inputPromise;
  assert(got.held === 1, "held count");
  console.log("input fan-out ok");

  companion.send(
    JSON.stringify({ type: "input", kind: "mouseL", phase: "down", pressId: 2, held: 1 }),
  );
  await onceMessage(overlay, (m) => m.type === "input" && m.kind === "mouseL");
  companion.send(
    JSON.stringify({ type: "input", kind: "mouseR", phase: "down", pressId: 3, held: 1 }),
  );
  await onceMessage(overlay, (m) => m.type === "input" && m.kind === "mouseR");
  console.log("mouse L/R ok");

  // Pause suppresses input
  companion.send(JSON.stringify({ type: "pause" }));
  const resetOnPause = onceMessage(overlay, (m) => m.type === "reset-idle" && m.reason === "pause");
  await resetOnPause;
  let sawDuringPause = false;
  const pauseSpy = (raw: WebSocket.RawData) => {
    const msg = JSON.parse(String(raw)) as { type: string };
    if (msg.type === "input") sawDuringPause = true;
  };
  overlay.on("message", pauseSpy);
  companion.send(
    JSON.stringify({ type: "input", kind: "key", phase: "down", pressId: 9, held: 1 }),
  );
  await wait(200);
  overlay.off("message", pauseSpy);
  assert(!sawDuringPause, "paused capture must not forward input");
  console.log("pause ok");

  companion.send(JSON.stringify({ type: "resume" }));
  await wait(100);

  // Disconnect → reset-idle
  const resetPromise = onceMessage(
    overlay,
    (m) => m.type === "reset-idle" && m.reason === "disconnect",
  );
  companion.close();
  await resetPromise;
  console.log("disconnect reset-idle ok");

  // Reconnect cleanly
  const companion2 = new WebSocket(WS_URL, { origin: "http://127.0.0.1:8787" });
  await new Promise<void>((res, rej) => {
    companion2.once("open", () => res());
    companion2.once("error", rej);
  });
  companion2.send(JSON.stringify({ type: "hello", role: "test", token }));
  await onceMessage(companion2, (m) => m.type === "status");
  const again = onceMessage(overlay, (m) => m.type === "input" && m.pressId === 42);
  companion2.send(
    JSON.stringify({ type: "input", kind: "key", phase: "down", pressId: 42, held: 1 }),
  );
  await again;
  console.log("reconnect ok");

  // Settings save/restore
  const settingsRes = await fetch(`${BASE}/api/settings`);
  const settings = (await settingsRes.json()) as {
    streamerName: string;
    modules: { identity: { x: number; visible: boolean } };
  };
  const patched = {
    ...settings,
    streamerName: "protocol-test-op",
    modules: {
      ...settings.modules,
      identity: { ...settings.modules.identity, x: 123, visible: false },
    },
  };
  const put = await fetch(`${BASE}/api/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patched),
  });
  assert(put.ok, "settings put");
  const againSettings = (await (await fetch(`${BASE}/api/settings`)).json()) as typeof patched;
  assert(againSettings.streamerName === "protocol-test-op", "name persisted");
  assert(againSettings.modules.identity.x === 123, "position persisted");
  assert(againSettings.modules.identity.visible === false, "visibility persisted");
  // restore default-ish name for demos
  await fetch(`${BASE}/api/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...againSettings,
      streamerName: "datguydaz",
      modules: {
        ...againSettings.modules,
        identity: { ...againSettings.modules.identity, x: 48, visible: true },
      },
    }),
  });
  console.log("settings persist ok");

  // Reject bad token
  const bad = new WebSocket(WS_URL, { origin: "http://127.0.0.1:8787" });
  await new Promise<void>((res, rej) => {
    bad.once("open", () => res());
    bad.once("error", rej);
  });
  bad.send(JSON.stringify({ type: "hello", role: "test", token: "nope" }));
  await onceMessage(bad, (m) => m.type === "error");
  console.log("bad token rejected");

  overlay.close();
  companion2.close();
  console.log("\nPROTOCOL VERIFIED on loopback (Windows uiohook not executed on this host).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
