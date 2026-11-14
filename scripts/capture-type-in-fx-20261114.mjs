/**
 * Capture mid type-in VFX frames (follow + sub) and a short mp4 of both.
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

async function cropPlate(kind, outPath) {
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

/** Drive type-in mid-frame: start demo, wait until type phase with some chars. */
async function captureMid(kind, outName) {
  await page.evaluate(async (k) => {
    const stage = document.getElementById("uw-stage");
    if (!stage) return;
    // Trigger via custom event path used by page — call demo through WS-less hook
    const name = k === "follow" ? "ZONE_SCOUT" : "RAID_CLEAR";
    const root = document.getElementById(k === "follow" ? "uw-follower" : "uw-subscriber");
    const nameEl = document.getElementById(
      k === "follow" ? "uw-follower-name" : "uw-subscriber-name",
    );
    if (!root || !nameEl) return;
    // Mirror SocialReadoutAnim smoke phases for a deterministic mid-frame
    root.dataset.socialFx = "static";
    nameEl.textContent = "";
    await new Promise((r) => setTimeout(r, 80));
    root.dataset.socialFx = "type";
    if (k === "sub") root.dataset.typeMark = "1";
    const partial = name.slice(0, Math.max(4, Math.ceil(name.length * 0.55)));
    nameEl.textContent = partial;
  }, kind);

  await page.waitForTimeout(kind === "sub" ? 220 : 140);
  const out = resolve(media, outName);
  await cropPlate(kind, out);
  console.log("wrote", out, existsSync(out) ? statSync(out).size : 0);
  return out;
}

await gotoSmoke();

// Still frames mid type-in
const followPng = await captureMid("follow", "type-in-fx-follow-20261114.png");
await page.evaluate(() => {
  const el = document.getElementById("uw-follower");
  if (el) delete el.dataset.socialFx;
});
await page.waitForTimeout(200);
const subPng = await captureMid("sub", "type-in-fx-sub-20261114.png");

// Animated sequence for video: run both demos via page module if available,
// else replay CSS phases with typed characters.
await page.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function run(kind, fullName) {
    const root = document.getElementById(kind === "follow" ? "uw-follower" : "uw-subscriber");
    const nameEl = document.getElementById(
      kind === "follow" ? "uw-follower-name" : "uw-subscriber-name",
    );
    const badge = root?.querySelector(".smk-new");
    if (!root || !nameEl) return;
    root.dataset.socialFx = "static";
    nameEl.textContent = "";
    await sleep(kind === "sub" ? 160 : 100);
    root.dataset.socialFx = "type";
    let built = "";
    for (const ch of fullName) {
      built += ch;
      nameEl.textContent = built;
      await sleep(28 + Math.floor(Math.random() * 24));
    }
    root.dataset.socialFx = "new";
    badge?.classList.add("on");
    if (kind === "sub") root.dataset.typeMark = "1";
    await sleep(kind === "sub" ? 900 : 400);
    root.dataset.socialFx = "settle";
    await sleep(kind === "sub" ? 700 : 400);
    delete root.dataset.socialFx;
    badge?.classList.remove("on");
  }
  await run("follow", "ZONE_SCOUT");
  await sleep(350);
  await run("sub", "RAID_CLEAR");
  await sleep(400);
});

await context.close();
await browser.close();

// Find recorded webm and convert if ffmpeg exists
const tmpDir = join(media, "_vidtmp");
const { readdirSync, renameSync, unlinkSync, rmSync } = await import("fs");
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
    // Keep webm as fallback rename
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
} else {
  console.log("no video recorded");
}

for (const p of [followPng, subPng]) {
  if (!existsSync(p) || statSync(p).size < 1000) {
    console.error("missing/small proof", p);
    process.exit(2);
  }
}
console.log("TYPE-IN FX CAPTURE OK");
