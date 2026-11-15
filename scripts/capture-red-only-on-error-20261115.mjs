/**
 * Proof: follower ERROR only while wrong text is on screen; neutral otherwise.
 * usage: node scripts/capture-red-only-on-error-20261115.mjs <mediaDir>
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
  console.error("usage: capture-red-only-on-error-20261115.mjs <mediaDir>");
  process.exit(1);
}
mkdirSync(media, { recursive: true });

const W = 3440;
const H = 1440;
const BASE = process.env.OVERLAY_URL || "http://127.0.0.1:8787";
const OUT_NAME = "red-only-on-error-20261115.mp4";

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

const vidTmp = join(media, "_vidtmp-red-only");
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

async function shotPlate(sel, outName, meta) {
  await page.waitForTimeout(120);
  await page.locator(sel).screenshot({
    path: resolve(media, outName),
    omitBackground: true,
  });
  writeFileSync(resolve(media, outName.replace(/\.png$/i, ".json")), JSON.stringify(meta, null, 2));
  console.log("shot", outName, meta);
}

// Follow: capture ERROR then neutral (after erase / during correct retype)
{
  const q = new URLSearchParams({
    typos: "1",
    demo: "follow",
    demoname: "REDONLY_FOL",
    capture: `${Date.now()}-f`,
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
    () => document.querySelector("#uw-follower")?.getAttribute("data-status") === "error",
    null,
    { timeout: 9000 },
  );
  const errMeta = await page.evaluate(() => {
    const el = document.querySelector("#uw-follower");
    return {
      status: el?.getAttribute("data-status") || "",
      name: el?.querySelector(".uw-glass-name")?.textContent || "",
      errVisible:
        getComputedStyle(el.querySelector(".smk-status-err")).display !== "none",
    };
  });
  await shotPlate(
    "#uw-follower .smk-plate",
    "red-only-on-error-follower-error-20261115.png",
    errMeta,
  );

  // Wait until ERROR clears (erase / neutral) while still typing or retyping
  await page.waitForFunction(
    () => {
      const el = document.querySelector("#uw-follower");
      const st = el?.getAttribute("data-status");
      const fx = el?.getAttribute("data-social-fx");
      return st !== "error" && fx === "type";
    },
    null,
    { timeout: 9000 },
  );
  const neuMeta = await page.evaluate(() => {
    const el = document.querySelector("#uw-follower");
    return {
      status: el?.getAttribute("data-status") || "",
      name: el?.querySelector(".uw-glass-name")?.textContent || "",
      fx: el?.getAttribute("data-social-fx") || "",
      errVisible:
        getComputedStyle(el.querySelector(".smk-status-err")).display !== "none",
    };
  });
  await shotPlate(
    "#uw-follower .smk-plate",
    "red-only-on-error-follower-neutral-20261115.png",
    neuMeta,
  );

  await page.waitForFunction(
    () => document.querySelector("#uw-follower")?.getAttribute("data-status") === "ok",
    null,
    { timeout: 9000 },
  );
  await page.waitForTimeout(400);
}

// Sub pass for the video (same red-only rule)
{
  const q = new URLSearchParams({
    typos: "1",
    demo: "sub",
    demoname: "REDONLY_SUB",
    capture: `${Date.now()}-s`,
  });
  await page.goto(`${BASE}/ultrawide-smoke.html?${q}`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForFunction(() => !!document.getElementById("uw-stage"), null, {
    timeout: 15000,
  });
  await page.mouse.click(40, 40);
  await page.waitForTimeout(9200);
}

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
