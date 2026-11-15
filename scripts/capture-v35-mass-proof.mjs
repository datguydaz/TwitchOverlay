import { chromium } from "playwright";
import { resolve } from "path";
import { writeFileSync, readFileSync } from "fs";
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
await page.waitForTimeout(200);

const dump = await page.evaluate(() => {
  const left = document.getElementById("sleeve-left-fill");
  const right = document.getElementById("sleeve-right-fill");
  const cs = getComputedStyle(left);
  const svg = left.ownerSVGElement;
  function widthAt(el, y) {
    let min = null,
      max = null;
    for (let x = 60; x <= 340; x += 1) {
      const p = svg.createSVGPoint();
      p.x = x;
      p.y = y;
      if (el.isPointInFill(p)) {
        if (min === null) min = x;
        max = x;
      }
    }
    return min === null ? null : { min, max, width: max - min };
  }
  // Hide stripes so mass is unambiguous
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
  return {
    fill: left.getAttribute("fill"),
    csFill: cs.fill,
    opacity: cs.opacity,
    display: cs.display,
    visibility: cs.visibility,
    fillOpacity: cs.fillOpacity,
    clip: cs.clipPath,
    coveredByDesk: (() => {
      // sample mid left sleeve point; what is topmost element?
      const p = svg.createSVGPoint();
      p.x = 110;
      p.y = 220;
      const ctm = left.getScreenCTM();
      const s = p.matrixTransform(ctm);
      const top = document.elementFromPoint(s.x, s.y);
      return { id: top?.id || null, tag: top?.tagName || null };
    })(),
    midL: widthAt(left, 220),
    midR: widthAt(right, 220),
    elbowL: widthAt(left, 240),
    elbowR: widthAt(right, 240),
  };
});
console.log("DUMP", JSON.stringify(dump, null, 2));

// gray bg mass proof (no stripes)
await page.addStyleTag({ content: "html,body{background:#6a6a6a!important}" });
const box = await page.locator(".avatar-root").boundingBox();
await page.screenshot({
  path: resolve(media, "avatar-proof-20261111-kb-arm-match-v35-mass-no-stripes-gray.png"),
  clip: box,
  type: "png",
});

// production dark bg mass proof (no stripes)
await page.evaluate(() => {
  document.body.style.background = "radial-gradient(circle at 40% 30%, #2a2a2a, #0a0a0a 72%)";
});
await page.screenshot({
  path: resolve(media, "avatar-proof-20261111-kb-arm-match-v35-mass-no-stripes-dark.png"),
  clip: box,
  type: "png",
});

// Side-by-side sleeve crops from gray
const clips = await page.evaluate(() => {
  const L = document.getElementById("sleeve-left-fill").getBoundingClientRect();
  const R = document.getElementById("sleeve-right-fill").getBoundingClientRect();
  const pad = 20;
  return {
    L: { x: L.x - pad, y: L.y - pad, width: L.width + pad * 2, height: L.height + pad * 2 },
    R: { x: R.x - pad, y: R.y - pad, width: R.width + pad * 2, height: R.height + pad * 2 },
  };
});
await page.addStyleTag({ content: "html,body{background:#6a6a6a!important}" });
await page.screenshot({
  path: resolve(media, "avatar-proof-20261111-kb-arm-match-v35-left-mass-only.png"),
  clip: clips.L,
  type: "png",
});
await page.screenshot({
  path: resolve(media, "avatar-proof-20261111-kb-arm-match-v35-right-mass-only.png"),
  clip: clips.R,
  type: "png",
});

// Pixel compare left vs right mass crops
function avgDark(file) {
  const png = PNG.sync.read(readFileSync(resolve(media, file)));
  const { width: w, height: h, data } = png;
  let dark = 0,
    gray = 0,
    n = 0;
  for (let y = Math.floor(h * 0.3); y < Math.floor(h * 0.75); y++) {
    for (let x = Math.floor(w * 0.2); x < Math.floor(w * 0.8); x++) {
      const i = (y * w + x) * 4;
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      n++;
      if (r < 55 && g < 60 && b < 75 && !(Math.abs(r - 106) < 20)) dark++;
      if (Math.abs(r - 106) < 25 && Math.abs(g - 106) < 25) gray++;
    }
  }
  return { dark, gray, n, darkPct: ((100 * dark) / n).toFixed(1) };
}
console.log("leftMass", avgDark("avatar-proof-20261111-kb-arm-match-v35-left-mass-only.png"));
console.log("rightMass", avgDark("avatar-proof-20261111-kb-arm-match-v35-right-mass-only.png"));
await browser.close();
