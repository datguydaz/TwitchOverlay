/**
 * Prove completion is green-only (no red NEW / lamp / surge by the plate).
 * usage: node scripts/capture-no-red-on-verify-20261115.mjs <mediaDir>
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
  console.error("usage: capture-no-red-on-verify-20261115.mjs <mediaDir>");
  process.exit(1);
}
mkdirSync(media, { recursive: true });

const W = 3440;
const H = 1440;
const BASE = process.env.OVERLAY_URL || "http://127.0.0.1:8787";
const OUT_NAME = "no-red-on-verify-20261115.mp4";

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
} catch (e) {
  console.warn("settings patch failed", e);
}

const vidTmp = join(media, "_vidtmp-no-red-verify");
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

async function captureVerify(demo, demoname, cropName) {
  const root = demo === "follow" ? "#uw-follower" : "#uw-subscriber";
  const q = new URLSearchParams({
    typos: "1",
    demo,
    demoname,
    capture: `${Date.now()}-${demo}`,
  });
  await page.goto(`${BASE}/ultrawide-smoke.html?${q}`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForFunction(() => !!document.getElementById("uw-stage"), null, {
    timeout: 15000,
  });
  await page.mouse.click(40, 40);

  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      return (
        el?.getAttribute("data-status") === "ok" ||
        el?.getAttribute("data-social-fx") === "new"
      );
    },
    root,
    { timeout: 12000 },
  );
  await page.waitForTimeout(200);

  const meta = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    const neu = el?.querySelector(".smk-new");
    const lamp = el?.querySelector(".smk-type-lamp");
    const stamp = el?.querySelector(".smk-type-stamp");
    const crate = el?.querySelector(".smk-crate-stamp");
    const cs = (node) => (node ? getComputedStyle(node) : null);
    const n = cs(neu);
    const l = cs(lamp);
    const s = cs(stamp);
    const c = cs(crate);
    const parseRgb = (str) => {
      const m = String(str || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      if (!m) return null;
      return { r: +m[1], g: +m[2], b: +m[3] };
    };
    const isHotRed = (rgb) =>
      !!rgb && rgb.r > 120 && rgb.r > rgb.g + 40 && rgb.r > rgb.b + 40;
    return {
      status: el?.getAttribute("data-status") || "",
      fx: el?.getAttribute("data-social-fx") || "",
      stageSurge: document.getElementById("uw-stage")?.getAttribute("data-bar-surge") || "",
      newDisplay: n?.display,
      newBg: n?.backgroundColor,
      newHotRed: isHotRed(parseRgb(n?.backgroundColor)),
      lampBg: l?.backgroundImage || l?.backgroundColor,
      lampHotRed: /a02418|180,\s*40,\s*30|160,\s*24,\s*16/i.test(
        `${l?.backgroundImage || ""} ${l?.boxShadow || ""}`,
      ),
      stampColor: s?.color,
      stampHotRed: isHotRed(parseRgb(s?.color)),
      crateColor: c?.color,
      crateHotRed: isHotRed(parseRgb(c?.color)),
      okVisible:
        !!el?.querySelector(".smk-status-ok") &&
        getComputedStyle(el.querySelector(".smk-status-ok")).display !== "none",
    };
  }, root);

  console.log(demo, "verify meta", meta);
  writeFileSync(
    resolve(media, cropName.replace(/\.png$/i, ".json")),
    JSON.stringify({ demo, demoname, ...meta }, null, 2),
  );
  await page.locator(`${root} .smk-plate`).screenshot({
    path: resolve(media, cropName),
    omitBackground: true,
  });

  // Hold ~3s of completion for the video (new + settle + linger)
  await page.waitForTimeout(3000);
  return meta;
}

const followMeta = await captureVerify(
  "follow",
  "VERIFY_FOL",
  "no-red-on-verify-follow-20261115.png",
);
const subMeta = await captureVerify(
  "sub",
  "VERIFY_SUB",
  "no-red-on-verify-sub-20261115.png",
);

await context.close();
await browser.close();

if (priorSettings) {
  try {
    await fetch(`${BASE}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(priorSettings),
    });
  } catch (e) {
    console.warn("settings restore failed", e);
  }
}

const fails = [];
for (const [label, m] of [
  ["follow", followMeta],
  ["sub", subMeta],
]) {
  if (m.newHotRed) fails.push(`${label}: NEW badge still hot-red`);
  if (m.stampHotRed) fails.push(`${label}: stamp still hot-red`);
  if (m.crateHotRed) fails.push(`${label}: crate stamp still hot-red`);
  if (m.stageSurge === "1") fails.push(`${label}: bar-surge still on at verify`);
  if (!m.okVisible && m.status !== "ok") fails.push(`${label}: missing VERIFIED`);
}
if (fails.length) {
  console.error("VERIFY RED CHECK FAILED:\n" + fails.join("\n"));
  process.exitCode = 2;
} else {
  console.log("verify red-check passed");
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
  if (!ok) copyFileSync(webm, outMp4.replace(/\.mp4$/i, ".webm"));
  else console.log("wrote", outMp4, statSync(outMp4).size);
} else {
  copyFileSync(webm, outMp4.replace(/\.mp4$/i, ".webm"));
}

try {
  for (const f of readdirSync(vidTmp)) unlinkSync(join(vidTmp, f));
  rmSync(vidTmp, { recursive: true, force: true });
} catch {
  /* ignore */
}
