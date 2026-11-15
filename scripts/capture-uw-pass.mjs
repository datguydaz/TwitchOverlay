import { chromium } from "playwright";
import { resolve } from "node:path";
import { mkdirSync } from "node:fs";

const ts = process.env.PROOF_TS;
const mediaStore = process.env.MEDIA_STORE;
mkdirSync(mediaStore, { recursive: true });
mkdirSync("_proofs", { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1720, height: 720 },
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();

async function shot(name, url, prep) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  if (prep) await prep(page);
  await page.waitForTimeout(400);
  const dest = resolve(mediaStore, name);
  const local = resolve("_proofs", name);
  await page.screenshot({ path: dest, type: "png", fullPage: false });
  await page.screenshot({ path: local, type: "png", fullPage: false });
  console.log("wrote", dest);
}

// 1) Full letterbox + large bottom chat + social SAMPLE
await shot(`avatar-proof-${ts}-letterbox-full.png`, "http://127.0.0.1:8787/ultrawide.html", async (p) => {
  await p.evaluate(() => {
    const chat = document.getElementById("uw-chat");
    const body = document.getElementById("uw-chat-body");
    const tag = document.getElementById("uw-chat-tag");
    if (chat && body) {
      if (tag) tag.textContent = "DATGUYDAZ // COMMS";
      body.textContent = "Extract window's thin. Move clean.";
      chat.dataset.show = "1";
    }
    const f = document.getElementById("uw-follower");
    const s = document.getElementById("uw-subscriber");
    if (f) f.hidden = false;
    if (s) s.hidden = false;
  });
});

// 2) Chat large at bottom (tight crop)
await page.setViewportSize({ width: 1720, height: 720 });
await page.goto("http://127.0.0.1:8787/ultrawide.html", { waitUntil: "networkidle" });
await page.evaluate(() => {
  const chat = document.getElementById("uw-chat");
  const body = document.getElementById("uw-chat-body");
  const tag = document.getElementById("uw-chat-tag");
  if (chat && body) {
    if (tag) tag.textContent = "DATGUYDAZ // COMMS";
    body.textContent = "Raid ready. Don't ego-peek mid.";
    chat.dataset.show = "1";
  }
});
await page.waitForTimeout(300);
const chatBox = await page.locator("#uw-chat").boundingBox();
const stage = await page.locator("#uw-stage").boundingBox();
const chatName = `avatar-proof-${ts}-chat-bottom.png`;
const clip = {
  x: Math.max(0, (chatBox?.x ?? stage.x) - 20),
  y: Math.max(0, (chatBox?.y ?? stage.y + stage.height * 0.7) - 40),
  width: Math.min(page.viewportSize().width - 10, (chatBox?.width ?? 800) + 280),
  height: Math.min(page.viewportSize().height - 10, (chatBox?.height ?? 120) + 220),
};
await page.screenshot({ path: resolve(mediaStore, chatName), clip, type: "png" });
await page.screenshot({ path: resolve("_proofs", chatName), clip, type: "png" });
console.log("wrote", resolve(mediaStore, chatName));

// 3) Hold pose zoom on avatar
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto("http://127.0.0.1:8787/avatar.html", { waitUntil: "networkidle" });
await page.evaluate(() => {
  document.body.style.background = "radial-gradient(circle at 40% 30%, #3a4030, #121410 70%)";
  const root = document.querySelector(".avatar-root");
  if (root) {
    root.dataset.key = "1";
    root.dataset.mouseL = "1";
    root.dataset.active = "1";
    root.dataset.source = "demo";
  }
});
await page.waitForTimeout(350);
const box = await page.locator(".avatar-root").boundingBox();
const holdName = `avatar-proof-${ts}-hold-pose.png`;
const holdClip = {
  x: box.x + box.width * 0.08,
  y: box.y + box.height * 0.48,
  width: box.width * 0.84,
  height: box.height * 0.46,
};
await page.screenshot({ path: resolve(mediaStore, holdName), clip: holdClip, type: "png" });
await page.screenshot({ path: resolve("_proofs", holdName), clip: holdClip, type: "png" });
console.log("wrote", resolve(mediaStore, holdName));

await browser.close();
