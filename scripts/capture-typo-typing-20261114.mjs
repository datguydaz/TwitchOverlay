/**
 * Capture follow+sub typo type-in demos to mp4 (with audio if possible).
 * usage: node scripts/capture-typo-typing-20261114.mjs <mediaDir>
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
  console.error("usage: capture-typo-typing-20261114.mjs <mediaDir>");
  process.exit(1);
}
mkdirSync(media, { recursive: true });

const W = 3440;
const H = 1440;
const BASE = process.env.OVERLAY_URL || "http://127.0.0.1:8787";

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

const vidTmp = join(media, "_vidtmp-typo");
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
  console.log("settings: operatorTypos forced on for capture (will restore)");
} catch (e) {
  console.warn("settings patch failed", e);
}

async function playDemo(kind) {
  await page.goto(`${BASE}/ultrawide-smoke.html?typos=1&demo=${kind}&capture=${Date.now()}`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForFunction(() => !!document.getElementById("uw-stage"), null, {
    timeout: 15000,
  });
  // Click to unlock audio in chromium
  await page.mouse.click(40, 40);
  await page.waitForTimeout(kind === "sub" ? 6200 : 5600);
}

await playDemo("follow");
await playDemo("follow");
await playDemo("sub");
await playDemo("sub");
await page.waitForTimeout(600);

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
const webm = join(vidTmp, vids.sort((a, b) => statSync(join(vidTmp, b)).size - statSync(join(vidTmp, a)).size)[0]);
const outMp4 = resolve(media, "typo-typing-20261114.mp4");
const ffmpeg = findFfmpeg();
if (ffmpeg) {
  // Keep audio track if present (Playwright webm may be silent in headless)
  const r = spawnSync(
    ffmpeg,
    [
      "-y",
      "-i",
      webm,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-shortest",
      outMp4,
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0 || !existsSync(outMp4)) {
    // Retry video-only
    const r2 = spawnSync(
      ffmpeg,
      ["-y", "-i", webm, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", outMp4],
      { encoding: "utf8" },
    );
    if (r2.status !== 0) {
      console.error(r.stderr || r2.stderr);
      copyFileSync(webm, outMp4.replace(/\.mp4$/, ".webm"));
    }
  }
  console.log("wrote", outMp4, existsSync(outMp4) ? statSync(outMp4).size : 0);
} else {
  const webmOut = outMp4.replace(/\.mp4$/, ".webm");
  copyFileSync(webm, webmOut);
  console.log("no ffmpeg; wrote", webmOut);
}

try {
  rmSync(vidTmp, { recursive: true, force: true });
} catch {
  for (const f of readdirSync(vidTmp)) {
    try {
      unlinkSync(join(vidTmp, f));
    } catch {
      /* ignore */
    }
  }
}

if (!existsSync(outMp4) || statSync(outMp4).size < 1000) {
  console.error("proof missing/small");
  process.exit(2);
}
console.log("TYPO TYPING CAPTURE OK");
