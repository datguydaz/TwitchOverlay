import { chromium } from "playwright";
import { resolve } from "path";
import { writeFileSync, readFileSync } from "fs";
import { PNG } from "pngjs";

const media = process.argv[2];
if (!media) throw new Error("usage: node verify-sleeve-spans.mjs <mediaDir>");

const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 })
).newPage();
await page.goto("http://127.0.0.1:8787/avatar.html", { waitUntil: "networkidle", cache: "no-store" });
await page.reload({ waitUntil: "networkidle" });
await page.addStyleTag({
  content:
    "#idle-breath,#vest-front-breath,#idle-head{animation:none!important;transform:none!important}" +
    "html,body{background:#6e6e6e!important}",
});
await page.waitForTimeout(300);

const report = await page.evaluate(() => {
  const svg = document.querySelector("svg");
  const left = document.getElementById("sleeve-left-fill");
  const right = document.getElementById("sleeve-right-fill");
  const csL = getComputedStyle(left);
  function span(el, y) {
    const hits = [];
    for (let x = 60; x <= 340; x += 2) {
      const p = svg.createSVGPoint();
      p.x = x;
      p.y = y;
      if (el.isPointInFill(p)) hits.push(x);
    }
    if (!hits.length) return null;
    return {
      min: hits[0],
      max: hits[hits.length - 1],
      width: hits[hits.length - 1] - hits[0],
      n: hits.length,
    };
  }
  const rows = [];
  for (const y of [168, 188, 208, 228, 248, 260]) {
    rows.push({ y, L: span(left, y), R: span(right, y) });
  }
  return {
    leftFill: left.getAttribute("fill"),
    rightFill: right.getAttribute("fill"),
    leftCsFill: csL.fill,
    leftOpacity: csL.opacity,
    leftDisplay: csL.display,
    leftD: left.getAttribute("d"),
    rightD: right.getAttribute("d"),
    rows,
  };
});
console.log(JSON.stringify(report, null, 2));

const box = await page.locator(".avatar-root").boundingBox();
const full = resolve(media, "avatar-proof-20261111-kb-arm-match-v35-full.png");
await page.screenshot({ path: full, clip: box, type: "png" });

// pair-rest and junction-left
const pair = {
  x: box.x + box.width * 0.12,
  y: box.y + box.height * 0.18,
  width: box.width * 0.76,
  height: box.height * 0.42,
};
await page.screenshot({
  path: resolve(media, "avatar-proof-20261111-kb-arm-match-v35-pair-rest.png"),
  clip: pair,
  type: "png",
});
const jl = await page.evaluate(() => {
  const vest = document.querySelector("#plate-carrier");
  const vr = vest.getBoundingClientRect();
  return { x: Math.max(0, vr.left - 140), y: Math.max(0, vr.top - 20), width: 280, height: 240 };
});
await page.screenshot({
  path: resolve(media, "avatar-proof-20261111-kb-arm-match-v35-junction-left.png"),
  clip: jl,
  type: "png",
});
console.log("wrote v35 full/pair/junction-left");
await browser.close();
