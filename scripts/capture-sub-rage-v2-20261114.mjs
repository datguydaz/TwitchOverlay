/**
 * Capture 2–3 sub rage v2 demos (incl. DATGUYDAZ) → sub-rage-v2-20261114.mp4
 * usage: node scripts/capture-sub-rage-v2-20261114.mjs <mediaDir>
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
  console.error("usage: capture-sub-rage-v2-20261114.mjs <mediaDir>");
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

try {
  const cur = await (await fetch(`${BASE}/api/settings`)).json();
  await fetch(`${BASE}/api/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...cur,
      operatorTypos: { enabled: true, chance: 1, subStyle: "rage" },
    }),
  });
  console.log("settings: sub rage forced for capture");
} catch (e) {
  console.warn("settings patch failed", e);
}

const demos = [
  { name: "DATGUYDAZ", wait: 9000 },
  { name: "RAID_READY", wait: 8800 },
  { name: "ZONE_SCOUT", wait: 8800 },
];

const vidTmp = join(media, "_vidtmp-rage-v2");
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
    demo: "sub",
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

const vids = readdirSync(vidTmp).filter((f) => f.endsWith(".webm"));
if (!vids.length) {
  console.error("no video");
  process.exit(1);
}
const webm = join(
  vidTmp,
  vids.sort((a, b) => statSync(join(vidTmp, b)).size - statSync(join(vidTmp, a)).size)[0],
);
const outMp4 = resolve(media, "sub-rage-v2-20261114.mp4");
const ffmpeg = findFfmpeg();
if (ffmpeg) {
  let ok = false;
  for (const args of [
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
    ["-y", "-i", webm, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", outMp4],
  ]) {
    const r = spawnSync(ffmpeg, args, { encoding: "utf8" });
    if (r.status === 0 && existsSync(outMp4) && statSync(outMp4).size > 1000) {
      ok = true;
      break;
    }
  }
  if (!ok) {
    copyFileSync(webm, outMp4.replace(/\.mp4$/, ".webm"));
    console.log("ffmpeg failed; kept webm");
  } else {
    console.log("wrote", outMp4, statSync(outMp4).size);
  }
} else {
  copyFileSync(webm, outMp4.replace(/\.mp4$/, ".webm"));
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
  console.error("proof missing");
  process.exit(2);
}
console.log("SUB RAGE V2 CAPTURE OK");
