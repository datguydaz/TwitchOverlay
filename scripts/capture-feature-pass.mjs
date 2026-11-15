import { chromium } from "playwright";
import { mkdirSync, readdirSync, existsSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import WebSocket from "ws";
import { readFileSync } from "node:fs";

const ts = process.env.PROOF_TS;
const mediaStore = process.env.MEDIA_STORE;
mkdirSync(mediaStore, { recursive: true });
mkdirSync("_proofs", { recursive: true });
mkdirSync("_proofs/vid", { recursive: true });

const token = readFileSync("data/local-token.txt", "utf8").trim();
const browser = await chromium.launch({ headless: true });

async function shotAvatar() {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:8787/avatar.html", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    document.body.style.background = "radial-gradient(circle at 40% 30%, #3a4030, #121410 70%)";
  });
  await page.waitForTimeout(600);
  // Force talk + chat for proof
  await page.evaluate(() => {
    const root = document.querySelector(".avatar-root");
    if (root) {
      root.dataset.talk = "1";
      const chat = root.querySelector("#avatar-chat");
      if (chat) {
        chat.querySelector(".chat-body").textContent = "Zone quiet. Keep your head on a swivel.";
        chat.dataset.show = "1";
      }
    }
  });
  await page.waitForTimeout(200);
  const checks = await page.evaluate(() => {
    const svg = document.querySelector(".avatar-root svg")?.innerHTML || "";
    return {
      hasEyes: svg.includes('id="eyes"'),
      hasDeskName: svg.includes("desk-streamer-name"),
      mouseCount: (svg.match(/id="prop-mouse"/g) || []).length,
      pupils: (svg.match(/class="pupil"/g) || []).length,
    };
  });
  console.log("checks", JSON.stringify(checks));
  const box = await page.locator(".avatar-root").boundingBox();
  const clip = { x: box.x + box.width * 0.15, y: box.y + box.height * 0.02, width: box.width * 0.7, height: box.height * 0.78 };
  const name = `avatar-proof-${ts}-eyes-chat.png`;
  await page.screenshot({ path: resolve(mediaStore, name), clip, type: "png" });
  await page.screenshot({ path: resolve("_proofs", name), clip, type: "png" });
  console.log("avatar", name);
  await ctx.close();
}

async function shotBars() {
  const ctx = await browser.newContext({ viewport: { width: 1720, height: 720 } });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:8787/ultrawide.html", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    document.body.style.background = "repeating-conic-gradient(#2a2e24 0% 25%, #1a1c18 0% 50%) 50% / 40px 40px";
  });
  await page.waitForTimeout(500);
  const name = `ultrawide-proof-${ts}-subtle-bars.png`;
  await page.screenshot({ path: resolve(mediaStore, name), type: "png" });
  await page.screenshot({ path: resolve("_proofs", name), type: "png" });
  console.log("bars", name);
  await ctx.close();
}

async function motionClip() {
  const ctx = await browser.newContext({
    viewport: { width: 960, height: 720 },
    recordVideo: { dir: "_proofs/vid", size: { width: 960, height: 720 } },
  });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:8787/avatar.html", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    document.body.style.background = "radial-gradient(circle at 40% 30%, #3a4030, #121410 70%)";
  });
  await page.waitForTimeout(800);
  // Simulate companion input via WS
  const ws = new WebSocket("ws://127.0.0.1:8787/ws", { origin: "http://127.0.0.1:8787" });
  await new Promise((res, rej) => { ws.once("open", res); ws.once("error", rej); });
  ws.send(JSON.stringify({ type: "hello", role: "test", token }));
  await page.waitForTimeout(200);
  for (let i = 0; i < 6; i++) {
    ws.send(JSON.stringify({ type: "input", kind: "key", phase: "down", pressId: 10 + i, held: 1 }));
    await page.waitForTimeout(70);
    ws.send(JSON.stringify({ type: "input", kind: "key", phase: "up", pressId: 10 + i, held: 0 }));
    await page.waitForTimeout(50);
  }
  ws.send(JSON.stringify({ type: "mic", level: 0.6, talking: true }));
  await page.evaluate(() => {
    const root = document.querySelector(".avatar-root");
    if (root) root.dataset.talk = "1";
  });
  await page.waitForTimeout(500);
  ws.send(JSON.stringify({ type: "chat-line", text: "Copy. Filter's clean — for now.", from: "demo" }));
  await page.waitForTimeout(900);
  ws.send(JSON.stringify({ type: "mic", level: 0.02, talking: false }));
  await page.waitForTimeout(400);
  ws.close();
  await ctx.close();
  const files = readdirSync("_proofs/vid").filter((f) => f.endsWith(".webm"));
  if (files.length) {
    const dest = resolve(mediaStore, `avatar-proof-${ts}-motion-mic.webm`);
    copyFileSync(resolve("_proofs/vid", files[0]), dest);
    console.log("video", dest, existsSync(dest));
  }
}

await shotAvatar();
await shotBars();
await motionClip();
await browser.close();
