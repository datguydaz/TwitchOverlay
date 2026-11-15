/**
 * Proof: bits fumbles the NAME (not the amount), then correct amount once.
 * usage: node scripts/capture-bits-name-typo-20261115.mjs <mediaDir>
 */
import { chromium } from "playwright";
import { join } from "path";
import {
  mkdirSync,
  existsSync,
  copyFileSync,
  statSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "fs";
import { spawnSync } from "child_process";

const media = process.argv[2];
if (!media) {
  console.error("usage: capture-bits-name-typo-20261115.mjs <mediaDir>");
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
      terminalWidthPct: 42,
      eventAnimScale: 1.75,
      operatorReactions: { ...(priorSettings?.operatorReactions || {}), bits: true },
    }),
  });
} catch (e) {
  console.warn("settings patch failed", e);
}

const vidTmp = join(media, "_vidtmp-bits-name-typo");
if (existsSync(vidTmp)) rmSync(vidTmp, { recursive: true, force: true });
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

await page.goto(
  `${BASE}/ultrawide-smoke.html?demo=bits&demoname=CHEERLORD&capture=${Date.now()}`,
  { waitUntil: "domcontentloaded", timeout: 30000 },
);
await page.waitForFunction(() => !!document.getElementById("uw-stage"));
await page.mouse.click(40, 40);

// Catch the name-typo ERR beat (wrong name ≠ CHEERLORD, sub ERR)
let typoSnap = null;
try {
  await page.waitForFunction(
    () => {
      const main = (document.querySelector("#smk-op-term-main")?.textContent || "").trim();
      const sub = (document.querySelector("#smk-op-term-sub")?.textContent || "").trim();
      const status = document
        .querySelector(".smk-op-term-screen")
        ?.getAttribute("data-status");
      return (
        main.length > 0 &&
        main !== "CHEERLORD" &&
        sub === "ERR" &&
        status === "error"
      );
    },
    null,
    { timeout: 20000 },
  );
  typoSnap = await page.evaluate(() => ({
    mode: document.querySelector("#smk-op-term-mode")?.textContent,
    main: document.querySelector("#smk-op-term-main")?.textContent,
    sub: document.querySelector("#smk-op-term-sub")?.textContent,
    status: document
      .querySelector(".smk-op-term-screen")
      ?.getAttribute("data-status"),
  }));
  console.log("typo", JSON.stringify(typoSnap));
} catch {
  console.warn("typo beat not observed in time");
}

// Final once-only layout
await page.waitForFunction(
  () => {
    const mode = document.querySelector("#smk-op-term-mode")?.textContent || "";
    const main = document.querySelector("#smk-op-term-main")?.textContent || "";
    const sub = document.querySelector("#smk-op-term-sub")?.textContent || "";
    const stamp = document.querySelector("#smk-op-term-stamp");
    const stampText = stamp && !stamp.hidden ? stamp.textContent || "" : "";
    const open = document.querySelector("#smk-op-terminal")?.getAttribute("data-open");
    return (
      open === "1" &&
      mode.includes("INCOMING FUNDS") &&
      main.trim() === "CHEERLORD" &&
      /500\s*BITS/.test(sub) &&
      sub.includes("✓") &&
      !sub.includes("FROM") &&
      !sub.includes("ERR") &&
      !stampText
    );
  },
  null,
  { timeout: 60000 },
);
await page.waitForTimeout(500);

const info = await page.evaluate(() => ({
  mode: document.querySelector("#smk-op-term-mode")?.textContent,
  main: document.querySelector("#smk-op-term-main")?.textContent,
  sub: document.querySelector("#smk-op-term-sub")?.textContent,
  stamp: document.querySelector("#smk-op-term-stamp")?.hidden
    ? ""
    : document.querySelector("#smk-op-term-stamp")?.textContent,
  open: document.querySelector("#smk-op-terminal")?.getAttribute("data-open"),
  status: document
    .querySelector(".smk-op-term-screen")
    ?.getAttribute("data-status"),
}));
console.log("final", JSON.stringify(info));

const png = join(media, "bits-name-typo-20261115.png");
await page.screenshot({ path: png, type: "png" });
console.log("png", png);

await page.waitForTimeout(4500);
await context.close();
await browser.close();

const videos = readdirSync(vidTmp).filter((f) => f.endsWith(".webm"));
const webm = join(vidTmp, videos[0]);
const outMp4 = join(media, "bits-name-typo-20261115.mp4");
const ffmpeg = findFfmpeg();
if (!ffmpeg) {
  copyFileSync(webm, outMp4.replace(/\.mp4$/, ".webm"));
} else {
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
      "-an",
      "-movflags",
      "+faststart",
      outMp4,
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0) {
    console.error(r.stderr);
    process.exit(1);
  }
  console.log("mp4", outMp4, statSync(outMp4).size);
}

try {
  rmSync(vidTmp, { recursive: true, force: true });
} catch {
  /* ignore */
}

if (priorSettings) {
  try {
    await fetch(`${BASE}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(priorSettings),
    });
  } catch {
    /* ignore */
  }
}

writeFileSync(
  join(media, "bits-name-typo-20261115-meta.json"),
  JSON.stringify({ typo: typoSnap, final: info }, null, 2),
);
console.log("done");
