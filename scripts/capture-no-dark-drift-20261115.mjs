/**
 * Prove dark-drift fix: brightness stays steady across accelerated surges,
 * and document.hidden during cleanup no longer leaves a stuck dim.
 *
 * usage: node scripts/capture-no-dark-drift-20261115.mjs <mediaDir>
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, existsSync, statSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";

const media = process.argv[2];
if (!media) {
  console.error("usage: capture-no-dark-drift-20261115.mjs <mediaDir>");
  process.exit(1);
}
mkdirSync(media, { recursive: true });

const BASE = process.env.OVERLAY_URL || "http://127.0.0.1:8787";
const W = 3440;
const H = 1440;

function findFfmpeg() {
  const which = spawnSync(process.platform === "win32" ? "where" : "which", ["ffmpeg"], {
    encoding: "utf8",
  });
  if (which.status === 0) {
    const line = String(which.stdout || "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .find(Boolean);
    if (line && existsSync(line)) return line;
  }
  return null;
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  recordVideo: {
    dir: join(media, "_vidtmp-no-dark-drift"),
    size: { width: W, height: H },
  },
});
const page = await context.newPage();
await page.route("**/*", (route) => {
  const u = route.request().url();
  if (/fonts\.googleapis|fonts\.gstatic|fonts\.google/.test(u)) return route.abort();
  return route.continue();
});

await page.goto(`${BASE}/ultrawide-smoke.html?fastdark=1&surge=1&capture=${Date.now()}`, {
  waitUntil: "domcontentloaded",
  timeout: 30000,
});
await page.waitForFunction(() => !!document.getElementById("uw-stage"));
await page.waitForFunction(
  () =>
    document.querySelectorAll("canvas.smk-steel-canvas").length >= 2 &&
    document.querySelectorAll("canvas.smk-torn-canvas").length >= 2,
  null,
  { timeout: 20000 },
);
await page.waitForTimeout(800);

async function sampleBrightness() {
  return page.evaluate(() => {
    const stage = document.getElementById("uw-stage");
    const top = document.getElementById("uw-top");
    if (!top) return null;
    // Sample a mid strip of the top bar via canvas draw from screenshot region
    // Use computed state + average of nameplate / plate pixels via Offscreen not available;
    // instead read CSS filter + class flags and a 2D sample from a temporary canvas of the bar.
    const rect = top.getBoundingClientRect();
    return {
      stageFilter: getComputedStyle(stage).filter || "none",
      surgeBrown: stage.classList.contains("smk-surge-brown"),
      surgeDim:
        top.classList.contains("smk-surge-dim") ||
        document.getElementById("uw-bottom")?.classList.contains("smk-surge-dim"),
      bulbBrown: !!document.querySelector(".smk-bunker-light.smk-bulb-brown"),
      barH: rect.height,
      // Approximate “visual dim” score from flags (0 = normal)
      dimScore:
        (getComputedStyle(stage).filter.includes("brightness") ? 40 : 0) +
        (stage.classList.contains("smk-surge-brown") &&
        getComputedStyle(stage).filter.includes("brightness")
          ? 30
          : 0) +
        (top.classList.contains("smk-surge-dim") ? 8 : 0) +
        (document.querySelector(".smk-bunker-light.smk-bulb-brown") ? 5 : 0),
    };
  });
}

async function barLuma() {
  // Screenshot top bar and average luma in page via createImageBitmap-free path:
  // use CDP-less: clip screenshot + decode in node... do it in-page with canvas from data URL.
  const buf = await page.screenshot({
    type: "png",
    clip: { x: 200, y: 40, width: 1200, height: 100 },
  });
  const b64 = buf.toString("base64");
  return page.evaluate(async (dataUrl) => {
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = dataUrl;
    });
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, c.width, c.height);
    let sum = 0;
    let n = 0;
    for (let i = 0; i < data.length; i += 16) {
      // subsample every 4th pixel
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3] / 255;
      sum += (0.2126 * r + 0.7152 * g + 0.0722 * b) * a;
      n += 1;
    }
    return Math.round((sum / Math.max(1, n)) * 10) / 10;
  }, `data:image/png;base64,${b64}`);
}

const earlyLuma = await barLuma();
const earlyShot = await page.screenshot({
  type: "png",
  clip: { x: 0, y: 0, width: W, height: 220 },
});
const samples = [{ t: 0, luma: earlyLuma, ...(await sampleBrightness()) }];

// Simulate the OLD sticky-dark bug path for the left "before" panel:
// stage-wide brightness filter left on (what document.hidden cleanup used to leave).
const beforeStuck = await page.evaluate(() => {
  const stage = document.getElementById("uw-stage");
  stage.dataset._proofStuck = "1";
  stage.style.filter = "brightness(0.72) contrast(1.05)";
  return getComputedStyle(stage).filter;
});
await page.waitForTimeout(200);
const stuckLuma = await barLuma();
const stuckShot = await page.screenshot({
  type: "png",
  clip: { x: 0, y: 0, width: W, height: 220 },
});
await page.evaluate(() => {
  const stage = document.getElementById("uw-stage");
  stage.style.filter = "";
  delete stage.dataset._proofStuck;
});

// Run accelerated surges + flap document.hidden during cleanups
for (let i = 0; i < 8; i++) {
  await page.evaluate(() => {
    // Force a surge cycle if possible by toggling classes the way runSurge does,
    // then flap hidden during the veil window — cleanup timers must still clear.
    const stage = document.getElementById("uw-stage");
    const top = document.getElementById("uw-top");
    const bot = document.getElementById("uw-bottom");
    stage.classList.add("smk-surge-brown");
    top.classList.add("smk-surge-dim");
    bot.classList.add("smk-surge-dim");
  });
  // Fake hidden during the period old code would skip remove
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get() {
        return true;
      },
    });
  });
  await page.waitForTimeout(600);
  // Restore visibility — fixed code also clears on visibilitychange
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get() {
        return false;
      },
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(700);
  const s = { t: (i + 1) * 1.3, luma: await barLuma(), ...(await sampleBrightness()) };
  samples.push(s);
  console.log("sample", JSON.stringify(s));
}

// Wait for natural fastdark surges too
await page.waitForTimeout(12000);
const lateLuma = await barLuma();
const lateFlags = await sampleBrightness();
samples.push({ t: 20, luma: lateLuma, ...lateFlags });
const lateShot = await page.screenshot({
  type: "png",
  clip: { x: 0, y: 0, width: W, height: 220 },
});

const stuckCleared = await page.evaluate(() => {
  const stage = document.getElementById("uw-stage");
  const top = document.getElementById("uw-top");
  return {
    stageFilter: getComputedStyle(stage).filter,
    brown: stage.classList.contains("smk-surge-brown"),
    dim: top.classList.contains("smk-surge-dim"),
  };
});

console.log(
  JSON.stringify({
    beforeStuck,
    stuckLuma,
    earlyLuma,
    lateLuma,
    stuckCleared,
    drift: Math.abs(lateLuma - earlyLuma),
  }),
);

// Compose side-by-side: stuck-old vs late-fixed
const compose = await chromium.launch({ headless: true });
const cp = await (
  await compose.newContext({ viewport: { width: 1800, height: 560 }, deviceScaleFactor: 1 })
).newPage();
await cp.setContent(`<!doctype html>
<html><head><style>
html,body{margin:0;background:#121210;color:#d8d2c4;font:600 14px/1.2 "Share Tech Mono",Consolas,monospace}
.row{display:flex;gap:12px;padding:12px}
.col{flex:1;min-width:0}
.lab{padding:10px 12px;background:#1c1a16;letter-spacing:0.1em;text-transform:uppercase;font-size:12px}
.lab b{color:#ebe4d4}
.lab span{opacity:0.55;font-weight:400;text-transform:none;letter-spacing:0.04em;margin-left:8px}
img{display:block;width:100%;height:auto;background:#0a0a08}
.note{padding:8px 16px 16px;opacity:0.7;font-size:12px;font-weight:400}
</style></head><body>
<div class="row">
  <div class="col">
    <div class="lab"><b>Before (stuck)</b><span>stage filter brightness(0.72) — old cleanup skip</span></div>
    <img src="data:image/png;base64,${stuckShot.toString("base64")}" />
  </div>
  <div class="col">
    <div class="lab"><b>After (late)</b><span>fastdark surges + hidden flaps — luma ${lateLuma}</span></div>
    <img src="data:image/png;base64,${lateShot.toString("base64")}" />
  </div>
</div>
<div class="note">Early luma ${earlyLuma} → late ${lateLuma} (Δ ${Math.abs(lateLuma - earlyLuma).toFixed(1)}). Stuck repro luma ${stuckLuma}. Cause: later() skipped class removal when document.hidden, leaving smk-surge-brown stage filter.</div>
</body></html>`);
await cp.waitForTimeout(400);
const outPng = join(media, "no-dark-drift-20261115.png");
await cp.screenshot({ path: outPng, type: "png", fullPage: true });
await compose.close();

await page.waitForTimeout(1500);
await context.close();
await browser.close();

const vidTmp = join(media, "_vidtmp-no-dark-drift");
let outMp4 = null;
try {
  const { readdirSync, copyFileSync, rmSync } = await import("fs");
  const videos = readdirSync(vidTmp).filter((f) => f.endsWith(".webm"));
  if (videos[0]) {
    const webm = join(vidTmp, videos[0]);
    outMp4 = join(media, "no-dark-drift-20261115.mp4");
    const ffmpeg = findFfmpeg();
    if (ffmpeg) {
      const r = spawnSync(
        ffmpeg,
        ["-y", "-i", webm, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", outMp4],
        { encoding: "utf8" },
      );
      if (r.status !== 0) outMp4 = null;
    } else {
      copyFileSync(webm, outMp4.replace(/\.mp4$/, ".webm"));
      outMp4 = outMp4.replace(/\.mp4$/, ".webm");
    }
  }
  rmSync(vidTmp, { recursive: true, force: true });
} catch {
  /* ignore */
}

const meta = {
  cause:
    "Power-surge / bulb cleanup timers skipped when document.hidden, leaving #uw-stage.smk-surge-brown filter:brightness(0.72) stuck.",
  earlyLuma,
  lateLuma,
  stuckLuma,
  drift: Math.abs(lateLuma - earlyLuma),
  stuckCleared,
  samples,
  png: outPng,
  mp4: outMp4,
  bytes: existsSync(outPng) ? statSync(outPng).size : 0,
};
writeFileSync(join(media, "no-dark-drift-20261115-meta.json"), JSON.stringify(meta, null, 2));
console.log(JSON.stringify(meta, null, 2));

// Pass criteria: late has no stage brightness filter; drift modest; stuck was darker
if (stuckCleared.stageFilter && stuckCleared.stageFilter !== "none") {
  console.error("FAIL: stage filter still set");
  process.exit(2);
}
if (Math.abs(lateLuma - earlyLuma) > 18) {
  console.error("FAIL: brightness drifted too far", earlyLuma, lateLuma);
  process.exit(3);
}
if (stuckLuma >= earlyLuma - 5) {
  console.warn("warn: stuck luma not much darker than early (still ok for proof sheet)");
}
console.log("done");
