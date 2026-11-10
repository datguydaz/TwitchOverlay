import { chromium } from "playwright";
import { resolve } from "node:path";
import { mkdirSync } from "node:fs";

const ts = process.env.PROOF_TS;
const mediaStore = process.env.MEDIA_STORE;
mkdirSync(mediaStore, { recursive: true });
mkdirSync("_proofs", { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 })
).newPage();
await page.goto("http://127.0.0.1:8787/avatar.html", { waitUntil: "networkidle" });
await page.evaluate(() => {
  document.body.style.background = "#1a1a1a";
});
await page.waitForTimeout(300);

const box = await page.locator(".avatar-root").boundingBox();
const clip = {
  x: box.x + box.width * 0.2,
  y: box.y + box.height * 0.12,
  width: box.width * 0.6,
  height: box.height * 0.48,
};

// Sample torso pixels for green bias (G noticeably > R and B)
const sample = await page.evaluate((c) => {
  const canvas = document.createElement("canvas");
  const w = Math.round(c.width);
  const h = Math.round(c.height);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  // draw via foreignObject not available — return null; use screenshot buffer below
  return { w, h };
}, clip);

const name = `avatar-proof-${ts}-black-vest.png`;
const buf = await page.screenshot({ path: resolve(mediaStore, name), clip, type: "png" });
await page.screenshot({ path: resolve("_proofs", name), clip, type: "png" });

// Pixel green-bias check on PNG via canvas in page
const bias = await page.evaluate(async (b64) => {
  const img = new Image();
  const p = new Promise((res, rej) => {
    img.onload = () => res(null);
    img.onerror = rej;
  });
  img.src = "data:image/png;base64," + b64;
  await p;
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  let warmGreen = 0;
  let darkNeutral = 0;
  let sampled = 0;
  // Center band of vest (avoid helm cream stripes)
  const y0 = Math.floor(c.height * 0.45);
  const y1 = Math.floor(c.height * 0.85);
  const x0 = Math.floor(c.width * 0.2);
  const x1 = Math.floor(c.width * 0.8);
  for (let y = y0; y < y1; y += 3) {
    for (let x = x0; x < x1; x += 3) {
      const i = (y * c.width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 200) continue;
      sampled++;
      if (g > r + 12 && g > b + 8) warmGreen++;
      if (Math.abs(r - g) <= 8 && Math.abs(g - b) <= 8 && r < 80) darkNeutral++;
    }
  }
  return { sampled, warmGreen, darkNeutral, greenPct: sampled ? +(100 * warmGreen / sampled).toFixed(2) : 0 };
}, buf.toString("base64"));

console.log("sample", JSON.stringify(sample));
console.log("bias", JSON.stringify(bias));
console.log("wrote", resolve(mediaStore, name));
await browser.close();
