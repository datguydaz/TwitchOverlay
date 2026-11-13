/**
 * Stack labeled top-edge crops for ?edge=red|steel|rust|phosphor|blackout.
 * Mid-grey backdrop behind the stage strip so the torn lip reads clearly.
 *
 * usage: node scripts/capture-edge-options-20261113.mjs <outDir>
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readFileSync } from "fs";
import { resolve } from "path";
import { PNG } from "pngjs";

const outDir = process.argv[2];
if (!outDir) {
  console.error("usage: capture-edge-options-20261113.mjs <outDir>");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const W = 3440;
const H = 1440;
const BAR = 180;
const STYLES = ["red", "steel", "rust", "phosphor", "blackout"];
/** Crop: lower part of top bar + a bit of stage */
const CROP_TOP = BAR - 56;
const CROP_H = 96;
const LABEL_H = 28;
const PANEL_H = CROP_H + LABEL_H;
const OUT_W = 1600;
const OUT_H = STYLES.length * PANEL_H + 16;
const BACKDROP = { r: 72, g: 74, b: 70, a: 255 }; // mid grey so edge reads

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
});

async function captureEdge(style) {
  const page = await context.newPage();
  await page.addInitScript(() => {
    try {
      localStorage.setItem("pz.uw.smoke.lastFollower", "RYSEABOVEIT");
      localStorage.setItem("pz.uw.smoke.lastSubscriber", "ACTYR:[6]");
    } catch {
      /* ignore */
    }
  });
  const url = `http://127.0.0.1:8787/ultrawide-smoke.html?bar=${BAR}&edge=${style}&gloom=${Date.now()}`;
  await page.goto(url, { waitUntil: "commit", timeout: 20000 });
  await page.waitForFunction(() => !!document.getElementById("uw-stage"), null, {
    timeout: 10000,
  });
  await page.waitForFunction(
    () =>
      document.querySelectorAll("canvas.smk-steel-canvas").length >= 2 &&
      document.querySelectorAll("canvas.smk-torn-canvas").length >= 2,
    null,
    { timeout: 15000 },
  );
  try {
    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready;
    });
    await page.waitForTimeout(350);
  } catch {
    await page.waitForTimeout(500);
  }
  const edge = await page.evaluate(() => document.getElementById("uw-stage")?.dataset.edge || "");
  if (edge !== style) {
    console.error(`edge mismatch: want ${style} got ${edge}`);
    process.exit(2);
  }
  // Composite stage over mid-grey so transparent hole doesn't hide the lip
  const pngBuf = await page.screenshot({ type: "png", omitBackground: true });
  await page.close();
  const src = PNG.sync.read(pngBuf);
  // Extract crop band
  const band = new PNG({ width: W, height: CROP_H });
  for (let y = 0; y < CROP_H; y++) {
    const sy = CROP_TOP + y;
    for (let x = 0; x < W; x++) {
      const si = (src.width * sy + x) << 2;
      const di = (band.width * y + x) << 2;
      const a = src.data[si + 3] / 255;
      // lerp over backdrop
      band.data[di] = Math.round(src.data[si] * a + BACKDROP.r * (1 - a));
      band.data[di + 1] = Math.round(src.data[si + 1] * a + BACKDROP.g * (1 - a));
      band.data[di + 2] = Math.round(src.data[si + 2] * a + BACKDROP.b * (1 - a));
      band.data[di + 3] = 255;
    }
  }
  // Downscale to OUT_W
  const scale = OUT_W / W;
  const scaledH = Math.round(CROP_H * scale);
  const scaled = new PNG({ width: OUT_W, height: scaledH });
  for (let y = 0; y < scaledH; y++) {
    for (let x = 0; x < OUT_W; x++) {
      const sx = Math.min(W - 1, Math.floor(x / scale));
      const sy = Math.min(CROP_H - 1, Math.floor(y / scale));
      const si = (band.width * sy + sx) << 2;
      const di = (scaled.width * y + x) << 2;
      scaled.data[di] = band.data[si];
      scaled.data[di + 1] = band.data[si + 1];
      scaled.data[di + 2] = band.data[si + 2];
      scaled.data[di + 3] = 255;
    }
  }
  return { style, png: scaled, h: scaledH };
}

const panels = [];
for (const style of STYLES) {
  console.log("capturing", style);
  panels.push(await captureEdge(style));
}
await browser.close();

// Compose labeled stack via a small HTML canvas in a second playwright pass
// (easier text labels than raw PNG). Use node canvas-less approach: draw labels
// with a Playwright page that composites the strips.
const labelPage = await chromium.launch({ headless: true }).then((b) =>
  b.newContext({ viewport: { width: OUT_W, height: OUT_H }, deviceScaleFactor: 1 }).then(async (ctx) => {
    const page = await ctx.newPage();
    return { browser: b, page };
  }),
);

const stripsB64 = panels.map((p) => ({
  style: p.style,
  h: p.h,
  data: "data:image/png;base64," + PNG.sync.write(p.png).toString("base64"),
}));

await labelPage.page.setContent(`<!doctype html>
<html><head><style>
  html,body{margin:0;background:#1a1a18;color:#d8d2c4;font:600 15px/1 "Share Tech Mono",Consolas,monospace}
  .row{position:relative;width:${OUT_W}px}
  .lab{height:${LABEL_H}px;display:flex;align-items:center;padding:0 14px;letter-spacing:0.14em;text-transform:uppercase;
    background:linear-gradient(90deg,#22201c,#2a2824);border-bottom:1px solid #3a3832}
  .lab b{color:#ebe4d4;margin-right:10px}
  .lab span{opacity:0.55;font-weight:400;font-size:12px;letter-spacing:0.08em}
  img{display:block;width:${OUT_W}px;height:auto}
</style></head><body>
${stripsB64
  .map(
    (s) => `<div class="row">
  <div class="lab"><b>?edge=${s.style}</b><span>${
    s.style === "red"
      ? "current — dark-red warn hairline"
      : s.style === "steel"
        ? "cold bare-steel lip + weld bead"
        : s.style === "rust"
          ? "oxidised rust / burnt brown"
          : s.style === "phosphor"
            ? "dim green-grey CRT line (flickers)"
            : "raw dark lip — wire carries detail"
  }</span></div>
  <img src="${s.data}" width="${OUT_W}" height="${s.h}" />
</div>`,
  )
  .join("")}
</body></html>`);
await labelPage.page.waitForTimeout(400);
const outPath = resolve(outDir, "edge-options-20261113.png");
await labelPage.page.screenshot({ path: outPath, type: "png", fullPage: true });
await labelPage.browser.close();

const check = PNG.sync.read(readFileSync(outPath));
console.log(
  JSON.stringify({
    path: outPath,
    w: check.width,
    h: check.height,
    styles: STYLES,
    bytes: check.width * check.height,
  }),
);
if (check.width < 800 || check.height < 200) process.exit(3);
writeFileSync(
  resolve(outDir, "edge-options-20261113-meta.json"),
  JSON.stringify({ styles: STYLES, bar: BAR, out: outPath }, null, 2),
);
