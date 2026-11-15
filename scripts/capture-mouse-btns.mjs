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
  document.body.style.background = "radial-gradient(circle at 40% 30%, #3a4030, #121410 70%)";
});
await page.waitForTimeout(300);

const checks = await page.evaluate(() => {
  const svg = document.querySelector(".avatar-root svg")?.innerHTML || "";
  return {
    mice: (svg.match(/id="prop-mouse"/g) || []).length,
    lmb: svg.includes('id="mouse-lmb"'),
    rmb: svg.includes('id="mouse-rmb"'),
    deskLights: svg.includes("desk-lights") || /eq-light/.test(svg),
  };
});
console.log("checks", JSON.stringify(checks));

const root = page.locator(".avatar-root");
const box = await root.boundingBox();
const clip = {
  x: box.x + box.width * 0.45,
  y: box.y + box.height * 0.52,
  width: box.width * 0.5,
  height: box.height * 0.4,
};

// Idle: both amber
await page.evaluate(() => {
  const r = document.querySelector(".avatar-root");
  if (!r) return;
  r.dataset.mouseL = "0";
  r.dataset.mouseR = "0";
  r.dataset.key = "0";
});
await page.waitForTimeout(120);
const idle = `avatar-proof-${ts}-mouse-amber.png`;
await page.screenshot({ path: resolve(mediaStore, idle), clip, type: "png" });
await page.screenshot({ path: resolve("_proofs", idle), clip, type: "png" });
console.log("wrote", resolve(mediaStore, idle));

// LMB held dark + RMB amber; also show hold pose
await page.evaluate(() => {
  const r = document.querySelector(".avatar-root");
  if (!r) return;
  r.dataset.mouseL = "1";
  r.dataset.mouseR = "0";
  r.dataset.active = "1";
  r.dataset.source = "demo";
});
await page.waitForTimeout(120);
const hold = `avatar-proof-${ts}-mouse-lmb-hold.png`;
await page.screenshot({ path: resolve(mediaStore, hold), clip, type: "png" });
await page.screenshot({ path: resolve("_proofs", hold), clip, type: "png" });
console.log("wrote", resolve(mediaStore, hold));

await browser.close();
