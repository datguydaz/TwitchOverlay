import { chromium } from "playwright";
import { resolve } from "node:path";
import { mkdirSync } from "node:fs";

const ts = process.env.PROOF_TS;
const mediaStore = process.env.MEDIA_STORE;
mkdirSync(mediaStore, { recursive: true });
mkdirSync("_proofs", { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 })
).newPage();
await page.goto("http://127.0.0.1:8787/avatar.html", { waitUntil: "networkidle" });
await page.evaluate(() => {
  // Neutral gray bg so olive ambient doesn't tint helm reads
  document.body.style.background = "radial-gradient(circle at 40% 30%, #2a2a2a, #0a0a0a 72%)";
});
await page.waitForTimeout(450);

const meta = await page.evaluate(() => {
  const svg = document.querySelector(".avatar-root svg")?.innerHTML || "";
  const labels = [...document.querySelectorAll(".avatar-root .kb-label")].map((t) => t.textContent);
  const left = document.querySelector("#sleeve-stripes-left");
  const right = document.querySelector("#sleeve-stripes-right");
  return {
    slots: (svg.match(/id="kb-s\d+"/g) || []).length,
    hasNordic: labels.includes("Å") && labels.includes("Ö") && labels.includes("Ä"),
    leftClip: left?.getAttribute("clip-path") || "",
    rightClip: right?.getAttribute("clip-path") || "",
    kbTrapezoid: svg.includes('id="prop-keyboard"') && svg.includes("M68 238"),
    helmGray: /helmDark[\s\S]*?#404040/.test(svg),
  };
});
console.log("meta", JSON.stringify(meta));

const box = await page.locator(".avatar-root").boundingBox();
const kbClip = {
  x: box.x + box.width * 0.02,
  y: box.y + box.height * 0.48,
  width: box.width * 0.72,
  height: box.height * 0.44,
};
const mouseClip = {
  x: box.x + box.width * 0.48,
  y: box.y + box.height * 0.5,
  width: box.width * 0.48,
  height: box.height * 0.42,
};
const torsoClip = {
  x: box.x + box.width * 0.08,
  y: box.y + box.height * 0.22,
  width: box.width * 0.84,
  height: box.height * 0.4,
};
const helmClip = {
  x: box.x + box.width * 0.22,
  y: box.y + box.height * 0.08,
  width: box.width * 0.56,
  height: box.height * 0.38,
};
const chatClip = {
  x: box.x + box.width * 0.05,
  y: box.y + box.height * 0.02,
  width: box.width * 0.9,
  height: box.height * 0.35,
};

const shot = async (name, clip) => {
  const file = `avatar-proof-${ts}-${name}.png`;
  await page.screenshot({ path: resolve(mediaStore, file), clip, type: "png" });
  await page.screenshot({ path: resolve("_proofs", file), clip, type: "png" });
  console.log("wrote", resolve(mediaStore, file));
};

// Keyboard fill
await page.evaluate(() => {
  const r = document.querySelector(".avatar-root");
  if (!r) return;
  r.dataset.source = "demo";
  r.dataset.active = "1";
  r.dataset.key = "0";
  r.dataset.mouseL = "0";
  r.dataset.mouseR = "0";
  r.querySelector("#hand-left")?.setAttribute("style", "transform: translate(0,0)");
  r.querySelector("#hand-right")?.setAttribute("style", "");
  r.querySelectorAll(".kb-key[data-pressed]").forEach((el) => el.removeAttribute("data-pressed"));
});
await page.waitForTimeout(120);
await shot("kb-fill", kbClip);

// Sleeve stripes on fabric
await shot("sleeve-stripes", torsoClip);

// Gray/black helmet
await shot("helm-gray", helmClip);

// LMB — hand aims left pad
await page.evaluate(() => {
  const r = document.querySelector(".avatar-root");
  if (!r) return;
  r.dataset.mouseL = "1";
  r.dataset.mouseR = "0";
  r.dataset.mouseLPulse = "0";
  const lmb = r.querySelector("#mouse-lmb");
  const rmb = r.querySelector("#mouse-rmb");
  if (lmb) lmb.style.fill = "#c7923a";
  if (rmb) rmb.style.fill = "#1a1c16";
});
await page.waitForTimeout(140);
await shot("mouse-lmb", mouseClip);

// RMB — hand aims right pad
await page.evaluate(() => {
  const r = document.querySelector(".avatar-root");
  if (!r) return;
  r.dataset.mouseL = "0";
  r.dataset.mouseR = "1";
  const lmb = r.querySelector("#mouse-lmb");
  const rmb = r.querySelector("#mouse-rmb");
  if (lmb) lmb.style.fill = "#1a1c16";
  if (rmb) rmb.style.fill = "#c7923a";
});
await page.waitForTimeout(140);
await shot("mouse-rmb", mouseClip);

// Game chat line
await page.evaluate(() => {
  const r = document.querySelector(".avatar-root");
  if (!r) return;
  r.dataset.mouseL = "0";
  r.dataset.mouseR = "0";
  const chat = r.querySelector("#avatar-chat");
  const body = r.querySelector(".chat-body");
  const tag = r.querySelector(".chat-tag");
  if (tag) tag.textContent = "DATGUYDAZ // COMMS";
  if (body) body.textContent = "Tarkov lobby's spicy. Don't ego peek.";
  if (chat) chat.dataset.show = "1";
});
await page.waitForTimeout(160);
await shot("game-chat", chatClip);

await browser.close();
if (!meta.hasNordic || meta.slots !== 30 || !meta.leftClip.includes("clip-sleeve-left")) {
  console.error("proof checks failed", meta);
  process.exit(1);
}
