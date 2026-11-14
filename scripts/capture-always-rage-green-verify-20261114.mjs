/**
 * Capture follow + sub always-rage → green verify proof.
 * usage: node scripts/capture-always-rage-green-verify-20261114.mjs <mediaDir>
 * Restores prior live settings after capture (does not leave mock names).
 */
import { chromium } from "playwright";
import { resolve, join } from "path";
import {
  mkdirSync,
  existsSync,
  copyFileSync,
  statSync,
  readdirSync,
  unlinkSync,
  rmSync,
} from "fs";
import { spawnSync } from "child_process";

const media = process.argv[2];
if (!media) {
  console.error("usage: capture-always-rage-green-verify-20261114.mjs <mediaDir>");
  process.exit(1);
}
mkdirSync(media, { recursive: true });

const W = 3440;
const H = 1440;
const BASE = process.env.OVERLAY_URL || "http://127.0.0.1:8787";
const OUT_NAME = "always-rage-green-verify-20261114.mp4";

function findFfmpeg() {
  const fromEnv = process.env.FFMPEG;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
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

let priorSettings = null;
try {
  priorSettings = await (await fetch(`${BASE}/api/settings`)).json();
  await fetch(`${BASE}/api/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      operatorTypos: { enabled: true, chance: 1, subStyle: "rage" },
    }),
  });
  console.log("settings: always-rage for capture (will restore after)");
} catch (e) {
  console.warn("settings patch failed", e);
}

const demos = [
  { demo: "follow", name: "LORMIN_FX", wait: 9000 },
  { demo: "sub", name: "XERROL_FX", wait: 9200 },
];

const vidTmp = join(media, "_vidtmp-always-rage");
mkdirSync(vidTmp, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  recordVideo: { dir: vidTmp, size: { width: W, height: H } },
});
const page = await context.newPage();
await page.route("**/*", (route) => {
  const u = route.request().url();
  if (/fonts\.googleapis|fonts\.gstatic|fonts\.google/.test(u)) return route.abort();
  return route.continue();
});

for (let i = 0; i < demos.length; i++) {
  const d = demos[i];
  const q = new URLSearchParams({
    typos: "1",
    demo: d.demo,
    demoname: d.name,
    capture: `${Date.now()}-${i}`,
  });
  await page.goto(`${BASE}/ultrawide-smoke.html?${q}`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForFunction(() => !!document.getElementById("uw-stage"), null, {
    timeout: 15000,
  });
  await page.mouse.click(40, 40);
  await page.waitForTimeout(d.wait);
}

await page.waitForTimeout(500);
await context.close();
await browser.close();

if (priorSettings) {
  try {
    await fetch(`${BASE}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(priorSettings),
    });
    console.log("settings restored");
  } catch (e) {
    console.warn("settings restore failed", e);
  }
}

const vids = readdirSync(vidTmp).filter((f) => f.endsWith(".webm"));
if (!vids.length) {
  console.error("no video");
  process.exit(1);
}
const webm = join(
  vidTmp,
  vids.sort((a, b) => statSync(join(vidTmp, b)).size - statSync(join(vidTmp, a)).size)[0],
);
const outMp4 = resolve(media, OUT_NAME);
const ffmpeg = findFfmpeg();
if (ffmpeg) {
  let ok = false;
  for (const args of [
    ["-y", "-i", webm, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", outMp4],
    ["-y", "-i", webm, "-c:v", "libx264", "-pix_fmt", "yuv420p", outMp4],
  ]) {
    const r = spawnSync(ffmpeg, args, { encoding: "utf8" });
    if (r.status === 0 && existsSync(outMp4)) {
      ok = true;
      break;
    }
  }
  if (!ok) {
    copyFileSync(webm, outMp4.replace(/\.mp4$/i, ".webm"));
    console.warn("ffmpeg failed; left webm");
  } else {
    console.log("wrote", outMp4, statSync(outMp4).size);
  }
} else {
  const webmOut = outMp4.replace(/\.mp4$/i, ".webm");
  copyFileSync(webm, webmOut);
  console.warn("no ffmpeg; wrote", webmOut);
}

try {
  for (const f of readdirSync(vidTmp)) unlinkSync(join(vidTmp, f));
  rmSync(vidTmp, { recursive: true, force: true });
} catch {
  /* ignore */
}
