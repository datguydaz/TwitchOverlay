/**
 * Capture mid type-in VFX frames (follow + sub + wide sub) and a short mp4.
 * usage: node scripts/capture-type-in-fx-20261114.mjs <mediaDir>
 */
import { chromium } from "playwright";
import { resolve, join } from "path";
import { mkdirSync, existsSync, copyFileSync, statSync } from "fs";
import { spawnSync } from "child_process";

const media = process.argv[2];
if (!media) {
  console.error("usage: capture-type-in-fx-20261114.mjs <mediaDir>");
  process.exit(1);
}
mkdirSync(media, { recursive: true });

const W = 3440;
const H = 1440;
const BASE = process.env.OVERLAY_URL || "http://127.0.0.1:8787";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  recordVideo: {
    dir: join(media, "_vidtmp"),
    size: { width: W, height: H },
  },
});
const page = await context.newPage();

await page.route("**/*", (route) => {
  const u = route.request().url();
  if (/fonts\.googleapis|fonts\.gstatic|fonts\.google/.test(u)) return route.abort();
  return route.continue();
});

async function gotoSmoke() {
  await page.goto(`${BASE}/ultrawide-smoke.html?capture=${Date.now()}`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForFunction(() => !!document.getElementById("uw-stage"), null, {
    timeout: 15000,
  });
  await page.waitForTimeout(400);
}

async function cropPlate(kind, outPath, wide = false) {
  if (wide) {
    const top = await page.locator("#uw-top").boundingBox();
    if (!top) throw new Error("no #uw-top");
    await page.screenshot({
      path: outPath,
      omitBackground: true,
      clip: {
        x: 0,
        y: Math.max(0, top.y - 4),
        width: W,
        height: Math.min(H, top.height + 12),
      },
    });
    return;
  }
  const sel = kind === "follow" ? "#uw-follower" : "#uw-subscriber";
  const box = await page.locator(sel).boundingBox();
  if (!box) throw new Error(`no box for ${sel}`);
  const pad = 18;
  await page.screenshot({
    path: outPath,
    omitBackground: true,
    clip: {
      x: Math.max(0, box.x - pad),
      y: Math.max(0, box.y - pad),
      width: Math.min(W - box.x + pad, box.width + pad * 2),
      height: Math.min(H - box.y + pad, box.height + pad * 2 + 8),
    },
  });
}

async function captureMid(kind, outName, opts = {}) {
  await page.evaluate(async (k) => {
    const name = k === "follow" ? "ZONE_SCOUT" : "RAID_CLEAR";
    const root = document.getElementById(k === "follow" ? "uw-follower" : "uw-subscriber");
    const nameEl = document.getElementById(
      k === "follow" ? "uw-follower-name" : "uw-subscriber-name",
    );
    const ghost = root?.querySelector(".smk-type-ghost");
    const badge = root?.querySelector(".smk-new");
    const stage = document.getElementById("uw-stage");
    if (!root || !nameEl) return;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    nameEl.textContent = "";
    if (ghost) {
      ghost.textContent = "";
      ghost.classList.remove("on");
    }
    if (k === "follow") {
      root.dataset.socialFx = "acquire";
      await sleep(120);
      root.dataset.socialFx = "tune";
      await sleep(80);
      root.dataset.socialFx = "type";
      const partial = name.slice(0, Math.max(4, Math.ceil(name.length * 0.55)));
      nameEl.textContent = partial;
      if (ghost) {
        ghost.textContent = partial.slice(0, -1);
        ghost.classList.add("on");
      }
      root.classList.add("smk-spark-tick");
    } else {
      if (stage) {
        stage.dataset.barSurge = "1";
        stage.dataset.helmFlash = "1";
      }
      root.dataset.socialFx = "surge";
      await sleep(160);
      root.dataset.socialFx = "crt";
      await sleep(100);
      root.dataset.socialFx = "type";
      nameEl.textContent = name;
      await sleep(60);
      root.dataset.socialFx = "new";
      root.dataset.typeMark = "1";
      root.classList.add("smk-stamp-slam");
      badge?.classList.add("on");
      if (stage) delete stage.dataset.helmFlash;
    }
  }, kind);

  await page.waitForTimeout(kind === "sub" ? 320 : 180);
  const out = resolve(media, outName);
  await cropPlate(kind, out, !!opts.wide);
  console.log("wrote", out, existsSync(out) ? statSync(out).size : 0);
  return out;
}

await gotoSmoke();

const followPng = await captureMid("follow", "type-in-fx-follow-20261114.png");
await page.evaluate(() => {
  const el = document.getElementById("uw-follower");
  const stage = document.getElementById("uw-stage");
  if (el) {
    delete el.dataset.socialFx;
    el.classList.remove("smk-spark-tick");
  }
  if (stage) {
    delete stage.dataset.barSurge;
    delete stage.dataset.helmFlash;
  }
});
await page.waitForTimeout(200);
const subPng = await captureMid("sub", "type-in-fx-sub-20261114.png");
const subWide = await captureMid("sub", "type-in-fx-sub-wide-20261114.png", { wide: true });

await page.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const scramble = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#@$";
  const sc = () => scramble[Math.floor(Math.random() * scramble.length)];
  async function run(kind, fullName) {
    const root = document.getElementById(kind === "follow" ? "uw-follower" : "uw-subscriber");
    const nameEl = document.getElementById(
      kind === "follow" ? "uw-follower-name" : "uw-subscriber-name",
    );
    const ghost = root?.querySelector(".smk-type-ghost");
    const badge = root?.querySelector(".smk-new");
    const stage = document.getElementById("uw-stage");
    if (!root || !nameEl) return;
    nameEl.textContent = "";
    if (kind === "sub" && stage) {
      stage.dataset.barSurge = "1";
      stage.dataset.helmFlash = "1";
      root.dataset.socialFx = "surge";
      await sleep(280);
      root.dataset.socialFx = "crt";
      await sleep(160);
      delete stage.dataset.helmFlash;
    } else {
      root.dataset.socialFx = "acquire";
      await sleep(200);
      root.dataset.socialFx = "tune";
      await sleep(120);
    }
    root.dataset.socialFx = "type";
    let built = "";
    for (const ch of fullName) {
      if (kind === "sub") {
        nameEl.textContent = built + sc();
        await sleep(18);
      }
      if (ghost && built) {
        ghost.textContent = built;
        ghost.classList.add("on");
      }
      built += ch;
      nameEl.textContent = built;
      root.classList.add("smk-spark-tick");
      await sleep(30);
      root.classList.remove("smk-spark-tick");
    }
    root.dataset.socialFx = "new";
    badge?.classList.add("on");
    if (kind === "sub") {
      root.dataset.typeMark = "1";
      root.classList.add("smk-stamp-slam");
    }
    await sleep(kind === "sub" ? 900 : 400);
    root.dataset.socialFx = "settle";
    await sleep(kind === "sub" ? 600 : 350);
    delete root.dataset.socialFx;
    badge?.classList.remove("on");
    root.classList.remove("smk-stamp-slam");
    if (stage) delete stage.dataset.barSurge;
    if (kind === "sub") root.dataset.ember = "1";
  }
  await run("follow", "ZONE_SCOUT");
  await sleep(300);
  await run("sub", "RAID_CLEAR");
  await sleep(400);
});

await context.close();
await browser.close();

const tmpDir = join(media, "_vidtmp");
const { readdirSync, rmSync } = await import("fs");
let webm = null;
try {
  const files = readdirSync(tmpDir).filter((f) => f.endsWith(".webm"));
  if (files[0]) webm = join(tmpDir, files[0]);
} catch {
  /* none */
}

const mp4Out = resolve(media, "type-in-fx-20261114.mp4");
if (webm) {
  const ff = spawnSync(
    "ffmpeg",
    ["-y", "-i", webm, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", mp4Out],
    { encoding: "utf8" },
  );
  if (ff.status === 0 && existsSync(mp4Out)) {
    console.log("wrote", mp4Out, statSync(mp4Out).size);
  } else {
    const fallback = resolve(media, "type-in-fx-20261114.webm");
    copyFileSync(webm, fallback);
    console.log("ffmpeg unavailable or failed; wrote", fallback);
    console.log(ff.stderr?.slice(-400) || ff.error || "");
  }
  try {
    rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

for (const p of [followPng, subPng, subWide]) {
  if (!existsSync(p) || statSync(p).size < 1000) {
    console.error("missing/small proof", p);
    process.exit(2);
  }
}
console.log("TYPE-IN FX CAPTURE OK");
