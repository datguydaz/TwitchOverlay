import { chromium } from "playwright";
import { resolve } from "path";
import { mkdirSync, copyFileSync } from "fs";

const media = process.argv[2];
const also = process.argv[3];
if (!media) {
  console.error("usage: capture-restore-final-v13.mjs <media-dir> [also-copy-dir]");
  process.exit(1);
}
mkdirSync(media, { recursive: true });
if (also) mkdirSync(also, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1720, height: 760 }, deviceScaleFactor: 1 })
).newPage();

const url = `http://127.0.0.1:8787/ultrawide.html?v13=${Date.now()}`;
await page.goto(url, { waitUntil: "networkidle" });
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(700);

const dump = await page.evaluate(() => {
  return {
    footerTicker: !!document.querySelector(".uw-footer-ticker"),
    footerScan: !!document.querySelector(".uw-footer-scan"),
    seamlessTrack: !!document.querySelector(".uw-footer-ticker-track"),
    footerEmbers: document.querySelectorAll(".uw-footer-ember").length,
    rain: document.querySelectorAll(".uw-rain").length,
    tickerAnim: document.querySelector(".uw-footer-ticker")
      ? getComputedStyle(document.querySelector(".uw-footer-ticker")).animationName
      : null,
    emberAnim: document.querySelector(".uw-footer-ember")
      ? getComputedStyle(document.querySelector(".uw-footer-ember")).animationName
      : null,
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
  document.getElementById("uw-top").dataset.headerPulse = "1";
  const bot = document.getElementById("uw-bottom");
  bot.dataset.footerPulse = "1";
  bot.dataset.scanStutter = "1";
  bot.dataset.railPop = "3";
  document.querySelectorAll(".uw-header-ember,.uw-footer-ember").forEach((el, i) => {
    el.style.animation = "none";
    el.style.opacity = String(0.72 - (i % 6) * 0.07);
    el.style.transform = `translate3d(${8 + i * 5}px, ${-6 - (i % 3) * 3}px, 0) scale(1)`;
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
const out = "restore-final-v13-revert-loops-static.png";
const primary = resolve(media, out);
await page.screenshot({ path: primary, clip: stage, type: "png" });
console.log("wrote", primary);

if (also) {
  copyFileSync(primary, resolve(also, out));
  console.log("copied to", also);
}

await browser.close();
