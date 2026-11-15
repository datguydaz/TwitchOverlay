import { chromium } from "playwright";
import { resolve } from "path";
import { readFileSync, writeFileSync } from "fs";
import { PNG } from "pngjs";

const media = process.argv[2];
if (!media) throw new Error("media dir required");

const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 })
).newPage();
await page.goto("http://127.0.0.1:8787/avatar.html", { waitUntil: "networkidle" });
await page.reload({ waitUntil: "networkidle" });
await page.addStyleTag({
  content:
    "#idle-breath,#vest-front-breath,#idle-head{animation:none!important;transform:none!important}",
});
await page.waitForTimeout(250);

const geo = await page.evaluate(() => {
  const left = document.getElementById("sleeve-left-fill");
  const right = document.getElementById("sleeve-right-fill");
  const vest = document.getElementById("plate-carrier");
  return {
    leftD: left.getAttribute("d"),
    rightD: right.getAttribute("d"),
    leftFill: left.getAttribute("fill"),
    leftR: left.getBoundingClientRect(),
    rightR: right.getBoundingClientRect(),
    vestR: vest.getBoundingClientRect(),
  };
});
console.log("geo", JSON.stringify({ leftFill: geo.leftFill, leftD: geo.leftD, rightD: geo.rightD }, null, 2));

const box = await page.locator(".avatar-root").boundingBox();

async function shot(name, clip) {
  const file = resolve(media, `avatar-proof-20261111-kb-arm-match-v36-${name}.png`);
  await page.screenshot({ path: file, clip, type: "png" });
  console.log("wrote", file);
  return file;
}

// pair-rest on production dark
await page.evaluate(() => {
  document.body.style.background = "radial-gradient(circle at 40% 30%, #2a2a2a, #0a0a0a 72%)";
});
const pair = {
  x: box.x + box.width * 0.12,
  y: box.y + box.height * 0.18,
  width: box.width * 0.76,
  height: box.height * 0.42,
};
await shot("pair-rest", pair);
const jl = {
  x: Math.max(0, geo.vestR.left - 140),
  y: Math.max(0, geo.vestR.top - 20),
  width: 280,
  height: 240,
};
await shot("junction-left", jl);

// graybg full + left-mass-only (stripes on for artwork language; also mass-only variant for corridor gate)
await page.addStyleTag({ content: "html,body{background:#7a7a7a!important}" });
await shot("full-graybg", box);

const pad = 24;
await shot("left-mass-only", {
  x: Math.max(0, geo.leftR.x - pad),
  y: Math.max(0, geo.leftR.y - pad),
  width: geo.leftR.width + pad * 2,
  height: geo.leftR.height + pad * 2,
});

// Hide stripes for corridor pixel scan on a clean mass crop
await page.evaluate(() => {
  for (const id of [
    "sleeve-stripes-left",
    "sleeve-stripes-right",
    "sleeve-folds-left",
    "sleeve-folds-right",
    "sleeve-wear-left",
    "sleeve-wear-right",
  ]) {
    const el = document.getElementById(id);
    if (el) el.setAttribute("display", "none");
  }
});
const massPath = await shot("left-mass-only-nostripe", {
  x: Math.max(0, geo.leftR.x - pad),
  y: Math.max(0, geo.leftR.y - pad),
  width: geo.leftR.width + pad * 2,
  height: geo.leftR.height + pad * 2,
});
await shot("full-graybg-nostripe", box);

// Pixel corridor scan on full-graybg-nostripe
const fullPath = resolve(media, "avatar-proof-20261111-kb-arm-match-v36-full-graybg-nostripe.png");
const png = PNG.sync.read(readFileSync(fullPath));
const { width: w, height: h, data } = png;
const dpr = 2;
function px(cssX, cssY) {
  const x = Math.round((cssX - box.x) * dpr);
  const y = Math.round((cssY - box.y) * dpr);
  if (x < 0 || y < 0 || x >= w || y >= h) return null;
  const i = (y * w + x) * 4;
  return { r: data[i], g: data[i + 1], b: data[i + 2] };
}
function isGray(p) {
  return p && Math.abs(p.r - 122) < 25 && Math.abs(p.g - 122) < 25 && Math.abs(p.b - 122) < 25;
}
function isOlive(p) {
  return p && p.g > p.b + 6 && p.r > 55 && p.r < 170 && p.g > 65 && p.g < 170 && p.r + p.g > 140;
}
function isSleeve(p) {
  return p && p.r < 50 && p.g < 55 && p.b < 65 && !isGray(p);
}

const rows = [];
let maxGrey = 0;
for (let t = 0.06; t <= 0.42; t += 0.02) {
  const cy = geo.vestR.y + geo.vestR.height * t;
  let oliveEdge = null;
  for (let sx = geo.vestR.x - 40; sx < geo.vestR.x + geo.vestR.width * 0.55; sx += 0.5) {
    if (isOlive(px(sx, cy))) {
      oliveEdge = sx;
      break;
    }
  }
  if (oliveEdge == null) continue;
  let grey = 0;
  let hit = null;
  for (let sx = oliveEdge - 0.5; sx > oliveEdge - 100; sx -= 0.5) {
    const p = px(sx, cy);
    if (isSleeve(p)) {
      hit = sx;
      break;
    }
    if (isGray(p)) grey += 0.5;
  }
  maxGrey = Math.max(maxGrey, grey);
  rows.push({ t: +t.toFixed(2), greyCssPx: +grey.toFixed(1), hit: hit != null, oliveEdge: +oliveEdge.toFixed(1) });
}
console.log("LEFT corridor rows", JSON.stringify(rows, null, 2));
console.log("MAX_GREY_CSS_PX", maxGrey);

// Right corridor
const rowsR = [];
let maxGreyR = 0;
for (let t = 0.06; t <= 0.42; t += 0.02) {
  const cy = geo.vestR.y + geo.vestR.height * t;
  let oliveEdge = null;
  for (let sx = geo.vestR.x + geo.vestR.width + 40; sx > geo.vestR.x + geo.vestR.width * 0.45; sx -= 0.5) {
    if (isOlive(px(sx, cy))) {
      oliveEdge = sx;
      break;
    }
  }
  if (oliveEdge == null) continue;
  let grey = 0;
  let hit = null;
  for (let sx = oliveEdge + 0.5; sx < oliveEdge + 100; sx += 0.5) {
    const p = px(sx, cy);
    if (isSleeve(p)) {
      hit = sx;
      break;
    }
    if (isGray(p)) grey += 0.5;
  }
  maxGreyR = Math.max(maxGreyR, grey);
  rowsR.push({ t: +t.toFixed(2), greyCssPx: +grey.toFixed(1), hit: hit != null });
}
console.log("RIGHT corridor max", maxGreyR, rowsR.slice(0, 8));

writeFileSync(
  resolve(media, "avatar-proof-20261111-kb-arm-match-v36-corridor.json"),
  JSON.stringify({ maxGreyLeft: maxGrey, maxGreyRight: maxGreyR, rows, rowsR }, null, 2)
);

await browser.close();
process.exit(maxGrey > 1.5 ? 2 : 0);
