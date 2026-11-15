/**
 * Labelled 1:1 comparison of ?names=terminal|stencil|condensed|oswald
 * on ?edge=steel (both social boxes with real names).
 *
 * usage: node scripts/capture-name-fonts-20261113.mjs <outDir>
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readFileSync } from "fs";
import { resolve } from "path";
import { PNG } from "pngjs";

const outDir = process.argv[2];
if (!outDir) {
  console.error("usage: capture-name-fonts-20261113.mjs <outDir>");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const W = 3440;
const H = 1440;
const BAR = 180;
const STYLES = ["terminal", "stencil", "condensed", "oswald"];
const LABEL_H = 30;
const CROP_H = BAR + 6;
const OUT_W = 1600;
const scale = OUT_W / W;
const scaledH = Math.round(CROP_H * scale);
const OUT_H = STYLES.length * (LABEL_H + scaledH) + 8;

const DESCS = {
  terminal: "JetBrains Mono ExtraBold · phosphor #9fc48a",
  stencil: "Saira Stencil One · bone",
  condensed: "Bebas Neue · bone",
  oswald: "Oswald Bold · bone",
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
});

async function captureStyle(style) {
  const page = await context.newPage();
  await page.addInitScript(() => {
    try {
      localStorage.setItem("pz.uw.smoke.lastFollower", "RYSEABOVEIT");
      localStorage.setItem("pz.uw.smoke.lastSubscriber", "ACTYR:[6]");
    } catch {
      /* ignore */
    }
  });
  const url = `http://127.0.0.1:8787/ultrawide-smoke.html?bar=${BAR}&edge=steel&names=${style}&nf=${Date.now()}`;
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
    await page.waitForTimeout(500);
  } catch {
    await page.waitForTimeout(700);
  }
  // Force a long-name fit check with temporary stretch then restore
  const check = await page.evaluate((want) => {
    const s = document.getElementById("uw-stage");
    const fol = document.getElementById("uw-follower-name");
    const sub = document.getElementById("uw-subscriber-name");
    return {
      names: s?.dataset.names || "",
      want,
      fol: fol?.textContent || "",
      sub: sub?.textContent || "",
      folFont: fol ? getComputedStyle(fol).fontFamily : "",
      folColor: fol ? getComputedStyle(fol).color : "",
      folSize: fol ? getComputedStyle(fol).fontSize : "",
      subFont: sub ? getComputedStyle(sub).fontFamily : "",
    };
  }, style);
  if (check.names !== style) {
    console.error("names mismatch", check);
    process.exit(2);
  }
  if (check.fol !== "RYSEABOVEIT" || check.sub !== "ACTYR:[6]") {
    console.error("name text", check);
    process.exit(3);
  }
  // Verify long name shrinks
  const longFit = await page.evaluate(() => {
    const fol = document.getElementById("uw-follower-name");
    const parent = fol?.parentElement;
    if (!fol || !parent) return { ok: false };
    const prev = fol.textContent;
    fol.style.fontSize = "";
    fol.textContent = "TWENTYFIVECHARHANDLEXX";
    const base = Number.parseFloat(getComputedStyle(fol).fontSize) || 28;
    let size = base;
    const min = Math.max(13, base * 0.42);
    const maxW = Math.max(40, parent.clientWidth - 12);
    let guard = 0;
    while (fol.scrollWidth > maxW && size > min && guard++ < 60) {
      size -= 0.75;
      fol.style.fontSize = `${size}px`;
    }
    const fitted = fol.scrollWidth <= maxW + 2;
    const fittedSize = Number.parseFloat(fol.style.fontSize) || base;
    fol.textContent = prev;
    fol.style.fontSize = "";
    // re-fit real name
    size = Number.parseFloat(getComputedStyle(fol).fontSize) || 28;
    const min2 = Math.max(13, size * 0.42);
    guard = 0;
    while (fol.scrollWidth > maxW && size > min2 && guard++ < 60) {
      size -= 0.75;
      fol.style.fontSize = `${size}px`;
    }
    return { ok: fitted, base, fittedSize, maxW };
  });
  if (!longFit.ok) {
    console.error("long name fit failed", style, longFit);
    process.exit(4);
  }
  console.log("style", style, check.folFont.split(",")[0], check.folColor, check.folSize, "longFit", longFit);

  const pngBuf = await page.screenshot({
    type: "png",
    omitBackground: true,
    clip: { x: 0, y: 0, width: W, height: CROP_H },
  });
  await page.close();
  const src = PNG.sync.read(pngBuf);
  // Composite over dark charcoal so transparent stage reads
  const band = new PNG({ width: W, height: CROP_H });
  const bg = { r: 18, g: 18, b: 16 };
  for (let y = 0; y < CROP_H; y++) {
    for (let x = 0; x < W; x++) {
      const si = (src.width * y + x) << 2;
      const di = (band.width * y + x) << 2;
      const a = src.data[si + 3] / 255;
      band.data[di] = Math.round(src.data[si] * a + bg.r * (1 - a));
      band.data[di + 1] = Math.round(src.data[si + 1] * a + bg.g * (1 - a));
      band.data[di + 2] = Math.round(src.data[si + 2] * a + bg.b * (1 - a));
      band.data[di + 3] = 255;
    }
  }
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
  return { style, png: scaled, check };
}

const panels = [];
for (const style of STYLES) {
  panels.push(await captureStyle(style));
}
await browser.close();

const labelPage = await chromium.launch({ headless: true }).then((b) =>
  b.newContext({ viewport: { width: OUT_W, height: OUT_H }, deviceScaleFactor: 1 }).then(async (ctx) => {
    const page = await ctx.newPage();
    return { browser: b, page };
  }),
);

const strips = panels.map((p) => ({
  style: p.style,
  data: "data:image/png;base64," + PNG.sync.write(p.png).toString("base64"),
  desc: DESCS[p.style],
}));

await labelPage.page.setContent(`<!doctype html>
<html><head><style>
  html,body{margin:0;background:#141412;color:#d8d2c4;font:600 14px/1 "Share Tech Mono",Consolas,monospace}
  .row{width:${OUT_W}px}
  .lab{height:${LABEL_H}px;display:flex;align-items:center;gap:12px;padding:0 14px;letter-spacing:0.12em;text-transform:uppercase;
    background:linear-gradient(90deg,#1e1c18,#2a2822);border-bottom:1px solid #3a3830}
  .lab b{color:#ebe4d4}
  .lab span{opacity:0.55;font-weight:400;font-size:11px;letter-spacing:0.06em;text-transform:none}
  img{display:block;width:${OUT_W}px;height:${scaledH}px}
</style></head><body>
${strips
  .map(
    (s) => `<div class="row">
  <div class="lab"><b>?names=${s.style}</b><span>${s.desc}</span></div>
  <img src="${s.data}" width="${OUT_W}" height="${scaledH}" />
</div>`,
  )
  .join("")}
</body></html>`);
await labelPage.page.waitForTimeout(400);
const outPath = resolve(outDir, "name-fonts-20261113.png");
await labelPage.page.screenshot({ path: outPath, type: "png", fullPage: true });
await labelPage.browser.close();

const check = PNG.sync.read(readFileSync(outPath));
console.log(
  JSON.stringify({
    path: outPath,
    w: check.width,
    h: check.height,
    styles: STYLES,
  }),
);
if (check.width < 800 || check.height < 200) process.exit(5);
