/**
 * Capture key-frames for telex/dogtag/airdrop/lockdown + one mp4 of all four.
 * usage: node scripts/capture-event-scenes-20261114.mjs <mediaDir>
 */
import { chromium } from "playwright";
import { resolve, join } from "path";
import { mkdirSync, existsSync, copyFileSync, statSync, readdirSync, unlinkSync } from "fs";
import { spawnSync } from "child_process";

const media = process.argv[2];
if (!media) {
  console.error("usage: capture-event-scenes-20261114.mjs <mediaDir>");
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
  const candidates = [
    join(process.env.LOCALAPPDATA || "", "Microsoft", "WinGet", "Links", "ffmpeg.exe"),
    "C:\\\\ffmpeg\\\\bin\\\\ffmpeg.exe",
    join(media, "..", "..", "ffmpeg", "ffmpeg.exe"),
  ];
  for (const c of candidates) if (c && existsSync(c)) return c;
  return null;
}

const browser = await chromium.launch({ headless: true });
const vidTmp = join(media, "_vidtmp-esc");
mkdirSync(vidTmp, { recursive: true });
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

async function gotoSmoke(qs = "") {
  const q = qs ? `&${qs}` : "";
  await page.goto(`${BASE}/ultrawide-smoke.html?capture=${Date.now()}${q}`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForFunction(() => !!document.getElementById("uw-stage"), null, {
    timeout: 15000,
  });
  await page.waitForTimeout(500);
}

async function snapBar(which, outPath) {
  const sel = which === "bottom" ? "#uw-bottom" : "#uw-top";
  const box = await page.locator(sel).boundingBox();
  if (!box) throw new Error(`no ${sel}`);
  await page.screenshot({
    path: outPath,
    omitBackground: true,
    clip: {
      x: 0,
      y: Math.max(0, box.y - 2),
      width: W,
      height: Math.min(H - box.y + 2, box.height + 6),
    },
  });
  console.log("wrote", outPath, existsSync(outPath) ? statSync(outPath).size : 0);
}

/** Freeze a scene mid-narrative for a key-frame PNG. */
async function freezeScene(scene) {
  await page.evaluate(async (sc) => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const stage = document.getElementById("uw-stage");
    const show = (id, phase) => {
      const h = document.getElementById(id);
      if (!h) return null;
      h.hidden = false;
      h.dataset.esc = "1";
      h.dataset.phase = phase;
      return h;
    };
    // Clear
    for (const id of ["esc-telex", "esc-dogtag", "esc-airdrop", "esc-lockdown"]) {
      const h = document.getElementById(id);
      if (!h) continue;
      h.hidden = true;
      delete h.dataset.esc;
      delete h.dataset.phase;
    }
    if (sc === "telex") {
      const h = show("esc-telex", "feed");
      const print = h?.querySelector(".esc-print");
      if (print) print.textContent = "ZONE_SCOUT";
      const fol = document.getElementById("uw-follower");
      if (fol) fol.dataset.socialFx = "scene";
      await sleep(80);
      show("esc-telex", "pin");
      const pin = h?.querySelector(".esc-telex-pin");
      if (pin) pin.textContent = "ZONE_SCOUT";
      if (fol) fol.dataset.socialFx = "scene-pin";
      const name = document.getElementById("uw-follower-name");
      if (name) name.textContent = "ZONE_SCOUT";
    } else if (sc === "dogtag") {
      show("esc-dogtag", "engrave");
      const tag = document.querySelector("#esc-dogtag .esc-tag-name");
      if (tag) tag.textContent = "ZONE_SCOUT";
      const fol = document.getElementById("uw-follower");
      if (fol) fol.dataset.socialFx = "scene";
    } else if (sc === "airdrop") {
      show("esc-airdrop", "reveal");
      const rise = document.querySelector("#esc-airdrop .esc-rise-name");
      if (rise) rise.textContent = "RAID_CLEAR";
      // force chute landed pose
      const chute = document.querySelector("#esc-airdrop .esc-chute");
      if (chute) chute.style.cssText = "opacity:1;transform:translateY(58px)";
      const lid = document.querySelector("#esc-airdrop .esc-crate-lid");
      if (lid) lid.style.cssText = "transform:rotate(-118deg)";
      const flare = document.querySelector("#esc-airdrop .esc-air-flare");
      if (flare) flare.style.opacity = "1";
      const dust = document.querySelector("#esc-airdrop .esc-air-dust");
      if (dust) dust.style.opacity = "0.7";
      if (rise) rise.style.cssText = "opacity:1;transform:translateY(0)";
    } else if (sc === "lockdown") {
      show("esc-lockdown", "grind");
      const vault = document.querySelector("#esc-lockdown .esc-vault-name");
      if (vault) vault.textContent = "RAID_CLEAR";
      const left = document.querySelector("#esc-lockdown .esc-shutter.left");
      const right = document.querySelector("#esc-lockdown .esc-shutter.right");
      if (left) left.style.transform = "translateX(-35%)";
      if (right) right.style.transform = "translateX(35%)";
      if (stage) stage.dataset.barSurge = "1";
      const sub = document.getElementById("uw-subscriber");
      if (sub) {
        sub.dataset.socialFx = "scene-pin";
        sub.dataset.typeMark = "1";
      }
      const name = document.getElementById("uw-subscriber-name");
      if (name) name.textContent = "RAID_CLEAR";
    }
  }, scene);
  await page.waitForTimeout(280);
}

// --- Key-frame PNGs ---
await gotoSmoke("followfx=telex&subfx=airdrop&sfx=0");
await freezeScene("telex");
await snapBar("top", resolve(media, "event-scene-telex-20261114.png"));

await freezeScene("dogtag");
await snapBar("top", resolve(media, "event-scene-dogtag-20261114.png"));

await freezeScene("airdrop");
await snapBar("bottom", resolve(media, "event-scene-airdrop-20261114.png"));

await freezeScene("lockdown");
await snapBar("top", resolve(media, "event-scene-lockdown-20261114.png"));

// --- Live demo reel (all 4) ---
await page.evaluate(() => {
  for (const id of ["esc-telex", "esc-dogtag", "esc-airdrop", "esc-lockdown"]) {
    const h = document.getElementById(id);
    if (!h) continue;
    h.hidden = true;
    delete h.dataset.esc;
    delete h.dataset.phase;
    for (const el of h.querySelectorAll("[style]")) el.removeAttribute("style");
  }
  const stage = document.getElementById("uw-stage");
  if (stage) delete stage.dataset.barSurge;
  for (const id of ["uw-follower", "uw-subscriber"]) {
    const el = document.getElementById(id);
    if (!el) continue;
    delete el.dataset.socialFx;
    delete el.dataset.typeMark;
  }
});

async function playDemo(kind, scene) {
  const qs =
    kind === "follow"
      ? `followfx=${scene}&demo=follow&sfx=0`
      : `subfx=${scene}&demo=sub&sfx=0`;
  await gotoSmoke(qs);
  // Wait through most of the scene
  await page.waitForTimeout(kind === "follow" ? 4200 : 5200);
}

await playDemo("follow", "telex");
await playDemo("follow", "dogtag");
await playDemo("sub", "airdrop");
await playDemo("sub", "lockdown");
await page.waitForTimeout(800);

await context.close();
await browser.close();

const vids = readdirSync(vidTmp).filter((f) => f.endsWith(".webm"));
if (!vids.length) {
  console.error("no video recorded");
  process.exit(1);
}
const webm = join(vidTmp, vids[0]);
const outMp4 = resolve(media, "event-scenes-20261114.mp4");
const ffmpeg = findFfmpeg();
if (ffmpeg) {
  const r = spawnSync(
    ffmpeg,
    ["-y", "-i", webm, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", outMp4],
    { encoding: "utf8" },
  );
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    copyFileSync(webm, outMp4.replace(/\.mp4$/, ".webm"));
    console.log("ffmpeg failed; kept webm");
  } else {
    console.log("wrote", outMp4, statSync(outMp4).size);
  }
} else {
  const webmOut = outMp4.replace(/\.mp4$/, ".webm");
  copyFileSync(webm, webmOut);
  console.log("no ffmpeg; wrote", webmOut, statSync(webmOut).size);
}

for (const f of readdirSync(vidTmp)) {
  try {
    unlinkSync(join(vidTmp, f));
  } catch {
    /* ignore */
  }
}

console.log("done");
