import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "fs";
import { PNG } from "pngjs";
import { resolve } from "path";

const media = process.argv[2];
const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 })
).newPage();
await page.goto("http://127.0.0.1:8787/avatar.html", { waitUntil: "networkidle" });
await page.reload({ waitUntil: "networkidle" });
await page.addStyleTag({
  content:
    "#idle-breath,#vest-front-breath,#idle-head{animation:none!important;transform:none!important}" +
    "html,body{background:#7a7a7a!important}",
});
await page.waitForTimeout(200);

const info = await page.evaluate(() => {
  const svg = document.querySelector("svg");
  const left = document.getElementById("sleeve-left-fill");
  const right = document.getElementById("sleeve-right-fill");
  const ctm = left.getScreenCTM();
  function scr(x, y) {
    const p = svg.createSVGPoint();
    p.x = x;
    p.y = y;
    const s = p.matrixTransform(ctm);
    return { x: s.x, y: s.y };
  }
  function inside(el, x, y) {
    const p = svg.createSVGPoint();
    p.x = x;
    p.y = y;
    return el.isPointInFill(p);
  }
  // Points BETWEEN stripe corridors (approx mid-arm, between stripe strokes)
  const pts = [
    { id: "L-between-1-2", x: 116, y: 230 },
    { id: "L-between-2-3", x: 122, y: 228 },
    { id: "L-outboard-of-stripes", x: 100, y: 230 },
    { id: "L-inboard-of-stripes", x: 136, y: 210 },
    { id: "R-between-1-2", x: 284, y: 230 },
    { id: "R-between-2-3", x: 278, y: 228 },
    { id: "R-outboard-of-stripes", x: 300, y: 230 },
    { id: "R-inboard-of-stripes", x: 264, y: 210 },
  ];
  return pts.map((p) => ({
    ...p,
    inL: inside(left, p.x, p.y),
    inR: inside(right, p.x, p.y),
    screen: scr(p.x, p.y),
    top: (() => {
      const s = scr(p.x, p.y);
      const el = document.elementFromPoint(s.x, s.y);
      return { id: el?.id || null, tag: el?.tagName, fill: el?.getAttribute?.("fill") };
    })(),
  }));
});

const box = await page.locator(".avatar-root").boundingBox();
const shot = resolve(media, "avatar-proof-20261111-kb-arm-match-v35-sample-gray.png");
await page.screenshot({ path: shot, clip: box, type: "png" });
const png = PNG.sync.read(readFileSync(shot));
const { width: w, height: h, data } = png;
const dpr = 2;

function rgbAt(cssX, cssY) {
  const lx = Math.round((cssX - box.x) * dpr);
  const ly = Math.round((cssY - box.y) * dpr);
  if (lx < 0 || ly < 0 || lx >= w || ly >= h) return null;
  const i = (ly * w + lx) * 4;
  return { lx, ly, rgb: [data[i], data[i + 1], data[i + 2]] };
}

for (const p of info) {
  const r = rgbAt(p.screen.x, p.screen.y);
  console.log(JSON.stringify({ id: p.id, inL: p.inL, inR: p.inR, top: p.top, pixel: r }));
}

// Mark sample points with magenta 3x3 and rewrite annotated
for (const p of info) {
  const lx = Math.round((p.screen.x - box.x) * dpr);
  const ly = Math.round((p.screen.y - box.y) * dpr);
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const x = lx + dx,
        y = ly + dy;
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const i = (y * w + x) * 4;
      data[i] = 255;
      data[i + 1] = 0;
      data[i + 2] = 255;
    }
  }
}
writeFileSync(resolve(media, "avatar-proof-20261111-kb-arm-match-v35-sample-marked.png"), PNG.sync.write(png));
await browser.close();
