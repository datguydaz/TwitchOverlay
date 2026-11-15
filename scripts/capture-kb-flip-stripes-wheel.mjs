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
  document.body.style.background = "radial-gradient(circle at 40% 30%, #2a2a2a, #0a0a0a 72%)";
});
await page.waitForTimeout(400);

const meta = await page.evaluate(() => {
  const svg = document.querySelector(".avatar-root svg")?.innerHTML || "";
  const labels = [...document.querySelectorAll(".avatar-root .kb-label")].map((t) => t.textContent);
  const spc = document.querySelector("#kb-s26");
  const q = document.querySelector("#kb-s0");
  const spcY = spc?.querySelector("rect")?.getAttribute("y");
  const qY = q?.querySelector("rect")?.getAttribute("y");
  const left = document.querySelector("#sleeve-stripes-left");
  const fillL = document.querySelector("#sleeve-left-fill");
  const box = (el) => {
    if (!el || !el.getBBox) return null;
    const b = el.getBBox();
    return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) };
  };
  return {
    hasNordic: labels.includes("Å") && labels.includes("Ö") && labels.includes("Ä"),
    spcAboveQ: Number(spcY) < Number(qY),
    leftClip: left?.getAttribute("clip-path") || "",
    stripesL: box(left),
    fillL: box(fillL),
    hasWheel: !!document.querySelector("#mouse-wheel"),
  };
});
console.log("meta", JSON.stringify(meta));

const box = await page.locator(".avatar-root").boundingBox();
const shot = async (name, clip) => {
  const file = `avatar-proof-${ts}-${name}.png`;
  await page.screenshot({ path: resolve(mediaStore, file), clip, type: "png" });
  await page.screenshot({ path: resolve("_proofs", file), clip, type: "png" });
  console.log("wrote", resolve(mediaStore, file));
};

const kbClip = {
  x: box.x + box.width * 0.02,
  y: box.y + box.height * 0.48,
  width: box.width * 0.72,
  height: box.height * 0.44,
};
const torsoClip = {
  x: box.x + box.width * 0.05,
  y: box.y + box.height * 0.28,
  width: box.width * 0.9,
  height: box.height * 0.42,
};
const mouseClip = {
  x: box.x + box.width * 0.48,
  y: box.y + box.height * 0.5,
  width: box.width * 0.48,
  height: box.height * 0.42,
};

await page.evaluate(() => {
  const r = document.querySelector(".avatar-root");
  if (!r) return;
  r.dataset.source = "demo";
  r.dataset.active = "1";
  r.dataset.key = "0";
  r.dataset.mouseL = "0";
  r.dataset.mouseR = "0";
  delete r.dataset.wheel;
});
await page.waitForTimeout(120);
await shot("kb-face-him", kbClip);
await shot("sleeve-stripes-on", torsoClip);

await page.evaluate(() => {
  const r = document.querySelector(".avatar-root");
  if (!r) return;
  r.dataset.wheel = "down";
  r.dataset.mouseL = "0";
  r.dataset.mouseR = "0";
});
await page.waitForTimeout(80);
await shot("wheel-scroll", mouseClip);

await browser.close();

const inside =
  meta.fillL &&
  meta.stripesL &&
  meta.stripesL.x >= meta.fillL.x - 0.5 &&
  meta.stripesL.x + meta.stripesL.w <= meta.fillL.x + meta.fillL.w + 0.5;
if (!meta.hasNordic || !meta.spcAboveQ || !meta.leftClip.includes("clip-sleeve-left") || !meta.hasWheel || !inside) {
  console.error("proof checks failed", { meta, inside });
  process.exit(1);
}
