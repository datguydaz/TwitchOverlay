/**
 * Capture all six operator reactions into one mp4 + per-reaction PNGs.
 * usage: node scripts/capture-operator-reactions-20261115.mjs <mediaDir>
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
  console.error("usage: capture-operator-reactions-20261115.mjs <mediaDir>");
  process.exit(1);
}
mkdirSync(media, { recursive: true });

const W = 3440;
const H = 1440;
const BASE = process.env.OVERLAY_URL || "http://127.0.0.1:8787";
const OUT_NAME = "operator-reactions-20261115.mp4";

/** Peak-frame waiters (page function) + remaining hold so the video shows each beat. */
const REACTIONS = [
  {
    demo: "raid",
    peak: () =>
      (document.querySelector("#uw-follower .smk-react-line")?.textContent || "").includes(
        "INCOMING",
      ),
    holdMs: 1800,
  },
  {
    demo: "bits",
    peak: () =>
      (document.querySelector("#uw-subscriber .smk-react-line")?.textContent || "") === "ERR" ||
      (document.querySelector("#uw-subscriber")?.getAttribute("data-status") || "") === "error",
    holdMs: 2200,
  },
  {
    demo: "giftbomb",
    peak: () =>
      (document.querySelector("#uw-subscriber .smk-react-line")?.textContent || "").includes(
        "MULTIPLE",
      ),
    holdMs: 1600,
  },
  {
    demo: "idle",
    peak: () => {
      const t = document.querySelector("#uw-follower-name")?.textContent || "";
      return ["zzz", "anyone", "...", "afk", "hello", "ping"].some((x) =>
        t.toLowerCase().includes(x),
      );
    },
    holdMs: 1400,
  },
  {
    demo: "repeat",
    peak: () =>
      (document.querySelector("#uw-follower-name")?.textContent || "").includes("AGAIN"),
    holdMs: 1400,
  },
  {
    demo: "coffee",
    peak: () =>
      document.querySelector("#uw-stage")?.getAttribute("data-coffee-spill") === "1" ||
      (document.querySelector("#uw-follower .smk-react-line")?.textContent || "").includes(
        "COFFEE",
      ),
    holdMs: 700,
  },
];

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
      social: {
        latestFollower: priorSettings?.social?.latestFollower || "LORMIN",
        latestSubscriber: priorSettings?.social?.latestSubscriber || "RAID_READY",
      },
      operatorReactions: {
        ...(priorSettings?.operatorReactions || {}),
        raids: true,
        bits: true,
        giftBombs: true,
        idle: true,
        repeatName: true,
        coffee: true,
      },
    }),
  });
} catch (e) {
  console.warn("settings patch failed", e);
}

const vidTmp = join(media, "_vidtmp-operator-reactions");
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

const pngMeta = [];

for (const { demo, peak, holdMs } of REACTIONS) {
  console.log(`demo=${demo}`);
  const q = new URLSearchParams({
    demo,
    demoname:
      demo === "repeat"
        ? "LORMIN"
        : demo === "raid"
          ? "RAID_BOSS"
          : demo === "bits"
            ? "TIPPER"
            : "OPS",
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

  await page.waitForFunction(peak, null, { timeout: 15000 });
  const pngPath = join(media, `operator-reactions-${demo}-20261115.png`);
  await page.screenshot({ path: pngPath, type: "png" });
  pngMeta.push({ demo, png: pngPath, bytes: statSync(pngPath).size });
  console.log(`  png ${pngPath}`);
  await page.waitForTimeout(holdMs);
}

await context.close();
await browser.close();

const videos = readdirSync(vidTmp).filter((f) => f.endsWith(".webm"));
if (!videos.length) {
  console.error("no webm recorded");
  process.exit(1);
}
const webm = join(vidTmp, videos[0]);
const outMp4 = join(media, OUT_NAME);
const ffmpeg = findFfmpeg();
if (!ffmpeg) {
  copyFileSync(webm, join(media, OUT_NAME.replace(/\.mp4$/, ".webm")));
  console.warn("ffmpeg missing — left webm only");
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
    console.error(r.stderr || r.stdout);
    process.exit(1);
  }
  console.log(`mp4 ${outMp4} (${statSync(outMp4).size} bytes)`);
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
  join(media, "operator-reactions-20261115-meta.json"),
  JSON.stringify({ outMp4, pngMeta, base: BASE }, null, 2),
);
console.log("done");
