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

const checks = await page.evaluate(() => {
  const svg = document.querySelector(".avatar-root svg")?.innerHTML || "";
  const lmb = document.querySelector("#mouse-lmb");
  return {
    hasStripeGroups: svg.includes("sleeve-stripes-left") && svg.includes("sleeve-stripes-right"),
    lmbDefault: lmb?.getAttribute("fill"),
  };
});
console.log("checks", JSON.stringify(checks));

// Sleeve stripes zoom (left arm)
const stripeClip = {
  x: box.x + box.width * 0.02,
  y: box.y + box.height * 0.22,
  width: box.width * 0.38,
  height: box.height * 0.4,
};
const stripeName = `avatar-proof-${ts}-track-stripes.png`;
await page.screenshot({ path: resolve(mediaStore, stripeName), clip: stripeClip, type: "png" });
await page.screenshot({ path: resolve("_proofs", stripeName), clip: stripeClip, type: "png" });
console.log("wrote", resolve(mediaStore, stripeName));

const mouseClip = {
  x: box.x + box.width * 0.48,
  y: box.y + box.height * 0.52,
  width: box.width * 0.45,
  height: box.height * 0.38,
};

// Idle dark
await page.evaluate(() => {
  const r = document.querySelector(".avatar-root");
  if (!r) return;
  r.dataset.mouseL = "0";
  r.dataset.mouseR = "0";
  const lmb = r.querySelector("#mouse-lmb");
  const rmb = r.querySelector("#mouse-rmb");
  if (lmb) lmb.style.fill = "#1a1c16";
  if (rmb) rmb.style.fill = "#1a1c16";
});
await page.waitForTimeout(100);
const idleName = `avatar-proof-${ts}-mouse-idle.png`;
await page.screenshot({ path: resolve(mediaStore, idleName), clip: mouseClip, type: "png" });
await page.screenshot({ path: resolve("_proofs", idleName), clip: mouseClip, type: "png" });
console.log("wrote", resolve(mediaStore, idleName));

// LMB held amber
await page.evaluate(() => {
  const r = document.querySelector(".avatar-root");
  if (!r) return;
  r.dataset.mouseL = "1";
  r.dataset.mouseR = "0";
  const lmb = r.querySelector("#mouse-lmb");
  const rmb = r.querySelector("#mouse-rmb");
  if (lmb) lmb.style.fill = "#c7923a";
  if (rmb) rmb.style.fill = "#1a1c16";
});
await page.waitForTimeout(100);
const clickName = `avatar-proof-${ts}-mouse-lmb-click.png`;
await page.screenshot({ path: resolve(mediaStore, clickName), clip: mouseClip, type: "png" });
await page.screenshot({ path: resolve("_proofs", clickName), clip: mouseClip, type: "png" });
console.log("wrote", resolve(mediaStore, clickName));

await browser.close();
