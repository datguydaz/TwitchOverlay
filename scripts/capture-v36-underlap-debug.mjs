import { chromium } from "playwright";
import { resolve } from "path";
import { readFileSync, writeFileSync } from "fs";
import { PNG } from "pngjs";

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

await page.evaluate(() => {
  for (const id of [
    "sleeve-stripes-left",
    "sleeve-stripes-right",
    "sleeve-folds-left",
    "sleeve-folds-right",
    "sleeve-wear-left",
    "sleeve-wear-right",
  ]) {
    document.getElementById(id)?.setAttribute("display", "none");
  }
  // Magenta sleeve fills, keep vest olive; drop highlight so fill is pure
  document.getElementById("sleeve-left-fill").setAttribute("fill", "#ff00aa");
  document.getElementById("sleeve-left-bridge").setAttribute("fill", "#ff00aa");
  document.getElementById("sleeve-right-fill").setAttribute("fill", "#00aaff");
  document.getElementById("sleeve-right-bridge").setAttribute("fill", "#00aaff");
  // hide inset shade paths (no id) by dimming arm children fill opacity except main
  for (const arm of ["arm-left", "arm-right"]) {
    const g = document.getElementById(arm);
    for (const c of [...g.children]) {
      if (c.tagName === "path" && !c.id && c.getAttribute("fill") && c.getAttribute("fill") !== "none") {
        c.setAttribute("opacity", "0");
      }
      if (c.tagName === "path" && !c.id && c.getAttribute("stroke")) {
        c.setAttribute("opacity", "0");
      }
    }
  }
});

const box = await page.locator(".avatar-root").boundingBox();
const leftR = await page.evaluate(() => {
  const L = document.getElementById("sleeve-left-fill").getBoundingClientRect();
  const V = document.getElementById("plate-carrier").getBoundingClientRect();
  return {
    clip: {
      x: Math.max(0, Math.min(L.x, V.x) - 30),
      y: Math.max(0, Math.min(L.y, V.y) - 20),
      width: 420,
      height: 320,
    },
  };
});
await page.screenshot({
  path: resolve(media, "avatar-proof-20261111-kb-arm-match-v36-underlap-magenta.png"),
  clip: leftR.clip,
  type: "png",
});
await page.screenshot({
  path: resolve(media, "avatar-proof-20261111-kb-arm-match-v36-underlap-magenta-full.png"),
  clip: box,
  type: "png",
});

// Count magenta pixels that are ALSO inside vest bbox (true underlap area)
const png = PNG.sync.read(
  readFileSync(resolve(media, "avatar-proof-20261111-kb-arm-match-v36-underlap-magenta.png"))
);
const { width: w, height: h, data } = png;
let mag = 0,
  olive = 0,
  grayBetween = 0;
// crude: in center band of crop
for (let y = Math.floor(h * 0.15); y < Math.floor(h * 0.55); y++) {
  let seenMag = false,
    seenGrayAfterMag = false,
    seenOlive = false;
  for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    const isMag = r > 200 && g < 80 && b > 120;
    const isOlive = g > b + 6 && r > 55 && r < 170 && g > 65;
    const isGray = Math.abs(r - 122) < 25 && Math.abs(g - 122) < 25;
    if (isMag) {
      mag++;
      seenMag = true;
    }
    if (isOlive) {
      olive++;
      if (seenMag && seenGrayAfterMag) grayBetween++;
      seenOlive = true;
    }
    if (seenMag && !seenOlive && isGray) seenGrayAfterMag = true;
  }
}
console.log({ mag, olive, grayBetweenRowsHits: grayBetween });
await browser.close();
