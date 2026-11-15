/**
 * Proof: follow type-in + bits OPS typing with audible typewriter clacks.
 * usage: node scripts/capture-typewriter-sfx-20261115.mjs <mediaDir>
 *
 * One page session: MediaRecorder tees BunkerSfx master bus while demos run.
 */
import { chromium } from "playwright";
import { resolve, join } from "path";
import {
  mkdirSync,
  existsSync,
  copyFileSync,
  writeFileSync,
  statSync,
  readdirSync,
  unlinkSync,
  rmSync,
} from "fs";
import { spawnSync } from "child_process";

const media = process.argv[2];
if (!media) {
  console.error("usage: capture-typewriter-sfx-20261115.mjs <mediaDir>");
  process.exit(1);
}
mkdirSync(media, { recursive: true });

const W = 1920;
const H = 800;
const BASE = process.env.OVERLAY_URL || "http://127.0.0.1:8797";
const OUT_NAME = "typewriter-sfx-20261115.mp4";

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
        latestFollower: "LORMIN",
        latestSubscriber: priorSettings?.social?.latestSubscriber || "RAID_READY",
      },
      sfx: {
        enabled: true,
        volume: 0.9,
        follow: {
          preset: "typewriter",
          customId: "",
          pool: [],
          typewriterLayer: false,
          volume: 1,
        },
        sub: {
          preset: "typewriter",
          customId: "",
          pool: [],
          typewriterLayer: false,
          volume: 1,
        },
      },
      operatorTypos: { enabled: true, chance: 1, subStyle: "rage" },
      operatorReactions: {
        ...(priorSettings?.operatorReactions || {}),
        enabled: true,
        bits: true,
        donations: true,
        raids: true,
      },
      eventAnimScale: 1.15,
    }),
  });
  console.log("settings: typewriter SFX forced for capture");
} catch (e) {
  console.warn("settings patch failed", e);
}

const vidTmp = join(media, "_vidtmp-typewriter-sfx");
const audioPath = join(media, "_typewriter-sfx-audio.webm");
mkdirSync(vidTmp, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--autoplay-policy=no-user-gesture-required"],
});
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
  `${BASE}/ultrawide-smoke.html?sfx=1&vol=0.95&sfxcap=1&capture=${Date.now()}&demoname=CLACKER`,
  { waitUntil: "domcontentloaded", timeout: 30000 },
);
await page.waitForFunction(() => !!document.getElementById("uw-stage"), null, {
  timeout: 15000,
});
await page.mouse.click(48, 48);
await page.waitForTimeout(300);

const audioStarted = await page.evaluate(async () => {
  const w = /** @type {any} */ (window);
  const sfx = w.__bunkerSfx;
  if (!sfx) return { ok: false, reason: "no-sfx" };
  await sfx.unlock();
  const stream = sfx.getCaptureStream?.();
  if (!stream) return { ok: false, reason: "no-stream" };
  const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";
  const chunks = [];
  const rec = new MediaRecorder(stream, { mimeType: mime });
  rec.ondataavailable = (e) => {
    if (e.data && e.data.size) chunks.push(e.data);
  };
  w.__pzAudioChunks = chunks;
  w.__pzAudioRec = rec;
  rec.start(100);
  // Warm keys so the recorder has samples before demos
  sfx.onTypeChar("follow", "T");
  sfx.onTypeChar("follow", "Y");
  sfx.onTypeChar("follow", "P");
  sfx.onTypeChar("follow", "E");
  return { ok: true, mime };
});
console.log("audio recorder", audioStarted);
if (!audioStarted?.ok) {
  console.error("failed to start audio capture", audioStarted);
  process.exit(6);
}

await page.waitForTimeout(250);

const followOk = await page.evaluate(() => {
  const demo = /** @type {any} */ (window).__pzDemo;
  if (!demo) return false;
  demo("follow");
  return true;
});
console.log("demo follow", followOk);
await page.waitForTimeout(7800);

const bitsOk = await page.evaluate(() => {
  const demo = /** @type {any} */ (window).__pzDemo;
  if (!demo) return false;
  demo("bits");
  return true;
});
console.log("demo bits", bitsOk);
await page.waitForTimeout(12000);

const audioB64 = await page.evaluate(async () => {
  const w = /** @type {any} */ (window);
  const rec = w.__pzAudioRec;
  const chunks = w.__pzAudioChunks || [];
  if (!rec) return "";
  await new Promise((resolve) => {
    rec.onstop = () => resolve(null);
    try {
      rec.requestData?.();
      rec.stop();
    } catch {
      resolve(null);
    }
  });
  await new Promise((r) => setTimeout(r, 120));
  const blob = new Blob(chunks, { type: "audio/webm" });
  if (!blob.size) return "";
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(binary);
});

await page.waitForTimeout(300);
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

if (audioB64) {
  writeFileSync(audioPath, Buffer.from(audioB64, "base64"));
  console.log("wrote audio", audioPath, statSync(audioPath).size);
} else {
  console.warn("no audio blob captured");
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
if (!ffmpeg) {
  copyFileSync(webm, outMp4.replace(/\.mp4$/, ".webm"));
  console.error("no ffmpeg");
  process.exit(3);
}

let ok = false;
if (existsSync(audioPath) && statSync(audioPath).size > 200) {
  const r = spawnSync(
    ffmpeg,
    [
      "-y",
      "-i",
      webm,
      "-i",
      audioPath,
      "-map",
      "0:v:0",
      "-map",
      "1:a:0",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "160k",
      "-shortest",
      "-movflags",
      "+faststart",
      outMp4,
    ],
    { encoding: "utf8" },
  );
  ok = r.status === 0 && existsSync(outMp4);
  if (!ok) console.warn(r.stderr?.slice(-1200));
}

if (!ok) {
  console.error("audio mux failed");
  process.exit(4);
}

console.log("wrote", outMp4, existsSync(outMp4) ? statSync(outMp4).size : 0);

const probe = spawnSync(ffmpeg, ["-i", outMp4], { encoding: "utf8" });
const probeTxt = `${probe.stderr || ""}\n${probe.stdout || ""}`;
const hasAudio = /Audio:/.test(probeTxt);
console.log("probe hasAudio=", hasAudio);
if (!hasAudio) {
  console.error("PROOF MISSING AUDIO TRACK");
  process.exit(5);
}

try {
  rmSync(vidTmp, { recursive: true, force: true });
} catch {
  /* ignore */
}
try {
  unlinkSync(audioPath);
} catch {
  /* ignore */
}

if (!existsSync(outMp4) || statSync(outMp4).size < 1000) {
  console.error("proof missing/small");
  process.exit(2);
}
console.log("TYPEWRITER SFX CAPTURE OK");
