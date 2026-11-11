import { chromium } from "playwright";
import { resolve } from "path";
import { mkdirSync, copyFileSync } from "fs";

const media = process.argv[2];
const also = process.argv[3];
if (!media) {
  console.error("usage: capture-restore-final-v8.mjs <media-dir> [also-copy-dir]");
  process.exit(1);
}
mkdirSync(media, { recursive: true });
if (also) mkdirSync(also, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1720, height: 760 }, deviceScaleFactor: 1 })
).newPage();

await page.goto("http://127.0.0.1:8787/ultrawide.html", { waitUntil: "networkidle" });
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(900);

const dump = await page.evaluate(() => {
  return {
    cssRainEls: document.querySelectorAll(".uw-rain").length,
    headerRail: !!document.querySelector(".uw-header-rail"),
    headerEmbers: document.querySelectorAll(".uw-header-ember").length,
    footerRail: !!document.querySelector(".uw-footer-rail"),
    footerEmbers: document.querySelectorAll(".uw-footer-ember").length,
    statusText: document.body.innerText.includes("ZONE THREAT"),
    repeatingGradients: [...document.querySelectorAll("#uw-top *, #uw-bottom *")]
      .map((el) => getComputedStyle(el).backgroundImage)
      .filter((bg) => /repeating-linear/i.test(bg)).length,
    dust: !!document.querySelector("#uw-atm-dust-shared"),
  };
});
console.log(JSON.stringify(dump, null, 2));

await page.addStyleTag({ content: "html,body{background:#070706!important}" });
await page.evaluate(() => {
  const s = document.getElementById("uw-stage");
  s.dataset.atm = "on";
  s.dataset.vfx = "on";
  s.dataset.textFx = "on";
  document.getElementById("uw-follower-name").textContent = "ZONE_SCOUT_LONGER";
  document.getElementById("uw-subscriber-name").textContent = "RAID_READY_LONGER";
  const top = document.getElementById("uw-top");
  top.dataset.headerPulse = "1";
  top.dataset.sparks = "r";
  const bot = document.getElementById("uw-bottom");
  bot.dataset.smoke = "1";
  bot.dataset.sparks = "l";
  bot.dataset.footerPulse = "1";
  // Freeze embers mid-drift so the static proof shows the beat
  document.querySelectorAll(".uw-header-ember").forEach((el, i) => {
    el.style.animation = "none";
    el.style.opacity = String(0.75 - i * 0.08);
    el.style.transform = `translate3d(${12 + i * 6}px, ${-10 - i * 4}px, 0) scale(1)`;
  });
  document.querySelectorAll(".uw-footer-ember").forEach((el, i) => {
    el.style.animation = "none";
    el.style.opacity = String(0.7 - i * 0.1);
    el.style.transform = `translate3d(${10 + i * 8}px, ${-12 - i * 5}px, 0) scale(1)`;
  });
});
await page.waitForTimeout(450);

const stage = await page.locator("#uw-stage").boundingBox();
const out = "restore-final-v8-top-beat-static.png";
const primary = resolve(media, out);
await page.screenshot({ path: primary, clip: stage, type: "png" });
console.log("wrote", primary);

await page.waitForTimeout(650);
const motion = resolve(media, "restore-final-v8-top-beat-motion-frame.png");
await page.screenshot({ path: motion, clip: stage, type: "png" });
console.log("wrote", motion);

const topBox = await page.locator("#uw-top").boundingBox();
const topCrop = resolve(media, "v8-topbar-crop.png");
await page.screenshot({ path: topCrop, clip: topBox, type: "png" });
console.log("wrote", topCrop);

if (also) {
  copyFileSync(primary, resolve(also, out));
  copyFileSync(motion, resolve(also, "restore-final-v8-top-beat-motion-frame.png"));
  copyFileSync(topCrop, resolve(also, "v8-topbar-crop.png"));
  console.log("copied to", also);
}

await browser.close();
