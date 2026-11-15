/**
 * Proof: narrower centred OPS terminal.
 * usage: node scripts/capture-terminal-centered-20261115.mjs <mediaDir>
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
  console.error("usage: capture-terminal-centered-20261115.mjs <mediaDir>");
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
      operatorReactions: {
        ...(priorSettings?.operatorReactions || {}),
        raids: true,
        bits: true,
        giftBombs: true,
        coffee: true,
      },
    }),
  });
} catch (e) {
  console.warn("settings patch failed", e);
}

const vidTmp = join(media, "_vidtmp-terminal-centered");
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

const demos = ["raid", "giftbomb", "bits", "coffee"];
let meta = null;

for (const demo of demos) {
  await page.goto(
    `${BASE}/ultrawide-smoke.html?demo=${demo}&capture=${Date.now()}-${demo}`,
    { waitUntil: "domcontentloaded", timeout: 30000 },
  );
  await page.waitForFunction(() => !!document.getElementById("uw-stage"));
  await page.mouse.click(40, 40);
  await page.waitForFunction(
    () => document.querySelector("#smk-op-terminal")?.getAttribute("data-open") === "1",
    null,
    { timeout: 20000 },
  );
  await page.waitForTimeout(demo === "raid" ? 1200 : 800);

  if (!meta) {
    meta = await page.evaluate(() => {
      const term = document.querySelector("#smk-op-terminal");
      const logo =
        document.querySelector("#uw-top-text .smk-name-face") ||
        document.querySelector("[data-streamer-name]");
      const stage = document.querySelector("#uw-stage");
      const bottom = document.querySelector("#uw-bottom");
      const tr = term.getBoundingClientRect();
      const lr = logo?.getBoundingClientRect();
      const br = bottom.getBoundingClientRect();
      const sr = stage.getBoundingClientRect();
      const termCx = tr.left + tr.width / 2;
      const logoCx = lr ? lr.left + lr.width / 2 : sr.width / 2;
      const stageCx = sr.left + sr.width / 2;
      return {
        termW: Math.round(tr.width),
        termH: Math.round(tr.height),
        widthPct: Math.round((tr.width / br.width) * 100),
        heightPct: Math.round((tr.height / br.height) * 100),
        termCx: Math.round(termCx),
        logoCx: Math.round(logoCx),
        stageCx: Math.round(stageCx),
        offsetVsLogo: Math.round(termCx - logoCx),
        offsetVsStage: Math.round(termCx - stageCx),
        cssPct: getComputedStyle(stage).getPropertyValue("--smk-op-term-w-pct").trim(),
        inside: tr.top >= br.top - 2 && tr.bottom <= br.bottom + 2,
        main: document.querySelector("#smk-op-term-main")?.textContent,
      };
    });
    const png = join(media, "terminal-centered-20261115.png");
    await page.screenshot({ path: png, type: "png" });
    console.log("png", png, JSON.stringify(meta));
  }

  await page.waitForTimeout(900);
}

await context.close();
await browser.close();

const videos = readdirSync(vidTmp).filter((f) => f.endsWith(".webm"));
const webm = join(vidTmp, videos[0]);
const outMp4 = join(media, "terminal-centered-20261115.mp4");
const ffmpeg = findFfmpeg();
if (!ffmpeg) {
  copyFileSync(webm, outMp4.replace(/\.mp4$/, ".webm"));
} else {
  const r = spawnSync(
    ffmpeg,
    ["-y", "-i", webm, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", outMp4],
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

writeFileSync(join(media, "terminal-centered-20261115-meta.json"), JSON.stringify(meta, null, 2));
console.log("done");
