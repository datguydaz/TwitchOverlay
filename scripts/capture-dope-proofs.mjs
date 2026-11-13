import { chromium } from "playwright";
import { mkdirSync, existsSync, copyFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const ts = process.env.PROOF_TS;
const mediaStore = process.env.MEDIA_STORE;
mkdirSync(mediaStore, { recursive: true });
mkdirSync("_proofs", { recursive: true });
mkdirSync("_proofs/vid", { recursive: true });

const browser = await chromium.launch({ headless: true });

// Avatar zoom + force cough
{
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:8787/avatar.html", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    document.body.style.background =
      "radial-gradient(circle at 40% 30%, #3a4030, #121410 70%)";
  });
  await page.waitForTimeout(800);
  // Force cough for still
  await page.evaluate(() => {
    const root = document.querySelector(".avatar-root");
    if (root) root.dataset.cough = "1";
  });
  await page.waitForTimeout(180);
  const root = page.locator(".avatar-root");
  const box = await root.boundingBox();
  const clip = {
    x: box.x + box.width * 0.18,
    y: box.y + box.height * 0.05,
    width: box.width * 0.64,
    height: box.height * 0.72,
  };
  const name = `avatar-proof-${ts}-motion-zoom.png`;
  await page.screenshot({ path: resolve(mediaStore, name), clip, type: "png" });
  await page.screenshot({ path: resolve("_proofs", name), clip, type: "png" });
  console.log("avatar", name);

  // Confirm no gold brow rect
  const brow = await page.evaluate(() => {
    const svg = document.querySelector(".avatar-root svg")?.outerHTML || "";
    return {
      hasGoldBrow: /fill="#c7923a"[^>]*y="96"|y="96"[^>]*fill="#c7923a"/.test(svg),
      hasShoulders: svg.includes("shoulder-left"),
      viewBox: document.querySelector(".avatar-root svg")?.getAttribute("viewBox"),
    };
  });
  console.log("checks", JSON.stringify(brow));
  await ctx.close();
}

// Ultrawide letterbox
{
  const ctx = await browser.newContext({
    viewport: { width: 1720, height: 720 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:8787/ultrawide.html", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    document.body.style.background =
      "repeating-conic-gradient(#2a2e24 0% 25%, #1a1c18 0% 50%) 50% / 40px 40px";
  });
  await page.waitForTimeout(900);
  // Force a glitch beat for drama in still
  await page.evaluate(() => {
    document.querySelectorAll(".uw-bar").forEach((el) => {
      el.dataset.glitch = "1";
    });
  });
  await page.waitForTimeout(80);
  const name = `ultrawide-proof-${ts}-letterbox.png`;
  await page.screenshot({ path: resolve(mediaStore, name), type: "png" });
  await page.screenshot({ path: resolve("_proofs", name), type: "png" });
  console.log("ultrawide", name);

  const top = page.locator("#uw-top");
  const tbox = await top.boundingBox();
  if (tbox) {
    const tname = `ultrawide-proof-${ts}-topbar.png`;
    const clip = { x: tbox.x, y: tbox.y, width: Math.min(tbox.width, 1720), height: tbox.height };
    await page.screenshot({ path: resolve(mediaStore, tname), clip, type: "png" });
    await page.screenshot({ path: resolve("_proofs", tname), clip, type: "png" });
    console.log("topbar", tname);
  }
  await ctx.close();
}

// Short avatar motion mp4 (idle + cough + roll)
{
  const ctx = await browser.newContext({
    viewport: { width: 960, height: 720 },
    deviceScaleFactor: 1,
    recordVideo: { dir: "_proofs/vid", size: { width: 960, height: 720 } },
  });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:8787/avatar.html", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    document.body.style.background =
      "radial-gradient(circle at 40% 30%, #3a4030, #121410 70%)";
  });
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    const root = document.querySelector(".avatar-root");
    if (root) root.dataset.cough = "1";
  });
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    const root = document.querySelector(".avatar-root");
    if (root) {
      delete root.dataset.cough;
      root.dataset.roll = "1";
    }
  });
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    const root = document.querySelector(".avatar-root");
    if (root) {
      delete root.dataset.roll;
      root.dataset.blink = "1";
    }
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const root = document.querySelector(".avatar-root");
    if (root) delete root.dataset.blink;
  });
  await page.waitForTimeout(800);
  await ctx.close();

  const files = readdirSync("_proofs/vid").filter((f) => f.endsWith(".webm"));
  if (!files.length) throw new Error("no video");
  const src = resolve("_proofs/vid", files[0]);
  const mp4Name = `avatar-proof-${ts}-idle-cough.mp4`;
  const dest = resolve(mediaStore, mp4Name);
  const ff = spawnSync(
    "ffmpeg",
    ["-y", "-i", src, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", dest],
    { encoding: "utf8" },
  );
  if (ff.status !== 0) {
    console.error(ff.stderr?.slice(-400));
    copyFileSync(src, dest.replace(/\.mp4$/, ".webm"));
    console.log("video-fallback", dest.replace(/\.mp4$/, ".webm"));
  } else {
    console.log("video", dest, "exists", existsSync(dest));
  }
}

await browser.close();
