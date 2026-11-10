/**
 * Record avatar reacting to demo-style WS inputs → avatar-demo.mp4
 */
import { chromium } from "playwright";
import WebSocket from "ws";
import { readFileSync, existsSync, mkdirSync, renameSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

const BASE = "http://127.0.0.1:8787";
const MEDIA = "/cursor/stores/self/media";
const OUT_DIR = "/tmp/avatar-demo-rec";
mkdirSync(MEDIA, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

const token = readFileSync("/workspace/data/local-token.txt", "utf8").trim();

async function sendInput(ws, kind, phase, pressId, held) {
  ws.send(JSON.stringify({ type: "input", kind, phase, pressId, held }));
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 960, height: 720 },
    recordVideo: { dir: OUT_DIR, size: { width: 960, height: 720 } },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/avatar.html`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  // Magenta page behind via CSS on body for visibility in recording? avatar page is transparent.
  await page.evaluate(() => {
    document.body.style.background =
      "radial-gradient(circle at 30% 30%, #3a4030, #1a1c18 70%)";
  });

  const ws = new WebSocket("ws://127.0.0.1:8787/ws", {
    origin: "http://127.0.0.1:8787",
  });
  await new Promise((res, rej) => {
    ws.once("open", res);
    ws.once("error", rej);
  });
  ws.send(JSON.stringify({ type: "hello", role: "test", token }));
  await new Promise((r) => setTimeout(r, 300));

  // Keyboard burst
  for (let i = 0; i < 8; i++) {
    await sendInput(ws, "key", "down", 100 + i, 1);
    await page.waitForTimeout(70);
    await sendInput(ws, "key", "up", 100 + i, 0);
    await page.waitForTimeout(50);
  }

  // Key hold
  await sendInput(ws, "key", "down", 200, 1);
  await page.waitForTimeout(900);
  await sendInput(ws, "key", "up", 200, 0);
  await page.waitForTimeout(200);

  // Left / right click
  await sendInput(ws, "mouseL", "down", 301, 1);
  await page.waitForTimeout(120);
  await sendInput(ws, "mouseL", "up", 301, 0);
  await page.waitForTimeout(200);
  await sendInput(ws, "mouseR", "down", 302, 1);
  await page.waitForTimeout(140);
  await sendInput(ws, "mouseR", "up", 302, 0);
  await page.waitForTimeout(300);

  // Disconnect → idle
  ws.close();
  await page.waitForTimeout(800);

  // Reconnect
  const ws2 = new WebSocket("ws://127.0.0.1:8787/ws", {
    origin: "http://127.0.0.1:8787",
  });
  await new Promise((res, rej) => {
    ws2.once("open", res);
    ws2.once("error", rej);
  });
  ws2.send(JSON.stringify({ type: "hello", role: "test", token }));
  await page.waitForTimeout(200);
  await sendInput(ws2, "key", "down", 400, 1);
  await page.waitForTimeout(400);
  await sendInput(ws2, "key", "up", 400, 0);
  await page.waitForTimeout(500);
  ws2.close();

  await context.close();
  await browser.close();

  // Find recorded webm and convert/copy
  const { readdirSync } = await import("node:fs");
  const files = readdirSync(OUT_DIR).filter((f) => f.endsWith(".webm"));
  if (!files.length) throw new Error("no video recorded");
  const src = resolve(OUT_DIR, files[0]);
  const destMp4 = `${MEDIA}/avatar-demo.mp4`;
  // Try ffmpeg convert; fallback copy webm renamed only if mp4 fails — prefer real mp4
  const { spawnSync } = await import("node:child_process");
  const ff = spawnSync(
    "ffmpeg",
    ["-y", "-i", src, "-c:v", "libx264", "-pix_fmt", "yuv420p", destMp4],
    { encoding: "utf8" },
  );
  if (ff.status !== 0) {
    console.error(ff.stderr);
    // last resort: still write something playable
    copyFileSync(src, destMp4);
  }
  console.log("video exists", existsSync(destMp4), destMp4);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
