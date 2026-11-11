import { chromium } from "playwright";
import { resolve } from "path";
import { mkdirSync, copyFileSync } from "fs";

const media = process.argv[2];
const also = process.argv[3];
if (!media) {
  console.error("usage: capture-restore-final-v11.mjs <media-dir> [also-copy-dir]");
  process.exit(1);
}
mkdirSync(media, { recursive: true });
if (also) mkdirSync(also, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1720, height: 760 }, deviceScaleFactor: 1 })
).newPage();

const url = `http://127.0.0.1:8787/ultrawide.html?v11=${Date.now()}`;
await page.goto(url, { waitUntil: "networkidle" });
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(800);

const dump = await page.evaluate(() => {
  return {
    cssRain: document.querySelectorAll(".uw-rain").length,
    footerTicker: !!document.querySelector(".uw-footer-ticker"),
    footerEmbers: document.querySelectorAll(".uw-footer-ember").length,
    railPops: document.querySelectorAll(".uw-footer-rail-pop").length,
    headerRail: !!document.querySelector(".uw-header-rail"),
    statusText: document.body.innerText.includes("ZONE THREAT"),
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
  const bot = document.getElementById("uw-bottom");
  bot.dataset.footerPulse = "1";
  bot.dataset.scanStutter = "1";
  bot.dataset.railPop = "3";
  bot.dataset.sparks = "l";
  document.querySelectorAll(".uw-header-ember,.uw-footer-ember").forEach((el, i) => {
    el.style.animation = "none";
    el.style.opacity = String(0.72 - (i % 6) * 0.07);
    el.style.transform = `translate3d(${8 + i * 5}px, ${-6 - (i % 3) * 3}px, 0) scale(1)`;
  });
  document.querySelectorAll(".uw-footer-rail-pop").forEach((el, i) => {
    if (i === 2) {
      el.style.animation = "none";
      el.style.opacity = "1";
      el.style.transform = "translateY(-3px) scale(1.15)";
    }
  });
  const ticker = document.querySelector(".uw-footer-ticker");
  if (ticker) {
    ticker.style.animation = "none";
    ticker.style.opacity = "0.55";
    ticker.style.transform = "translate3d(180%, 0, 0)";
  }
});
await page.waitForTimeout(400);

const stage = await page.locator("#uw-stage").boundingBox();
const out = "restore-final-v11-ember-scan-static.png";
const primary = resolve(media, out);
await page.screenshot({ path: primary, clip: stage, type: "png" });
console.log("wrote", primary);

await page.waitForTimeout(650);
const motion = resolve(media, "restore-final-v11-ember-scan-motion-frame.png");
await page.screenshot({ path: motion, clip: stage, type: "png" });
console.log("wrote", motion);

const botBox = await page.locator("#uw-bottom").boundingBox();
const botCrop = resolve(media, "v11-bottombar-crop.png");
await page.screenshot({ path: botCrop, clip: botBox, type: "png" });
console.log("wrote", botCrop);

if (also) {
  copyFileSync(primary, resolve(also, out));
  copyFileSync(motion, resolve(also, "restore-final-v11-ember-scan-motion-frame.png"));
  copyFileSync(botCrop, resolve(also, "v11-bottombar-crop.png"));
  console.log("copied to", also);
}

await browser.close();
