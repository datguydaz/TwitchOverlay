/**
 * Capture follow + sub ERROR / VERIFIED plate status lights.
 * usage: node scripts/capture-error-verify-lights-20261115.mjs <mediaDir>
 * Restores prior live settings after capture.
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
  writeFileSync,
} from "fs";
import { spawnSync } from "child_process";

const media = process.argv[2];
if (!media) {
  console.error("usage: capture-error-verify-lights-20261115.mjs <mediaDir>");
  process.exit(1);
}
mkdirSync(media, { recursive: true });

const W = 3440;
const H = 1440;
const BASE = process.env.OVERLAY_URL || "http://127.0.0.1:8787";
const OUT_NAME = "error-verify-lights-20261115.mp4";

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
  const tempGuess =
    process.env.LOCALAPPDATA &&
    join(
      process.env.LOCALAPPDATA,
      "Temp",
      "ffmpeg-typein",
      "ffmpeg-master-latest-win64-gpl-shared",
      "bin",
      "ffmpeg.exe",
    );
  if (tempGuess && existsSync(tempGuess)) return tempGuess;
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
  console.log("settings: always-rage for capture (will restore)");
} catch (e) {
  console.warn("settings patch failed", e);
}

const demos = [
  { demo: "follow", name: "ERRCHK_FOL", wait: 9200, wantStatus: "error", shotName: "error" },
  { demo: "sub", name: "ERRCHK_SUB", wait: 9400, wantStatus: "ok", shotName: "verify" },
];

const vidTmp = join(media, "_vidtmp-error-verify");
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

  const rootId = d.demo === "follow" ? "#uw-follower" : "#uw-subscriber";
  const started = Date.now();
  try {
    await page.waitForFunction(
      ({ sel, want }) => {
        const el = document.querySelector(sel);
        return el?.getAttribute("data-status") === want;
      },
      { sel: rootId, want: d.wantStatus },
      { timeout: d.wait },
    );
  } catch {
    console.warn(`timeout waiting for data-status=${d.wantStatus} on ${d.demo}`);
  }
  // Hold a beat so the strip is readable in the frame
  await page.waitForTimeout(180);
  const pngPath = resolve(media, `error-verify-lights-${d.shotName}-20261115.png`);
  const status = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    const err = el?.querySelector(".smk-status-err");
    const ok = el?.querySelector(".smk-status-ok");
    return {
      status: el?.getAttribute("data-status") || "",
      errVisible: !!err && getComputedStyle(err).display !== "none",
      okVisible: !!ok && getComputedStyle(ok).display !== "none",
      errText: err?.textContent || "",
      okText: ok?.textContent || "",
    };
  }, rootId);
  console.log(`shot ${d.shotName}:`, status);
  await page.screenshot({ path: pngPath, omitBackground: true });
  writeFileSync(
    resolve(media, `error-verify-lights-${d.shotName}-20261115.json`),
    JSON.stringify({ demo: d.demo, name: d.name, ...status }, null, 2),
  );

  const remain = Math.max(200, d.wait - (Date.now() - started));
  await page.waitForTimeout(remain);
}

await page.waitForTimeout(400);
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
