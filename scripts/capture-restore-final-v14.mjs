import { chromium } from "playwright";
import { resolve } from "path";
import { mkdirSync, copyFileSync } from "fs";

const media = process.argv[2];
const also = process.argv[3];
if (!media) {
  console.error("usage: capture-restore-final-v14.mjs <media-dir> [also-copy-dir]");
  process.exit(1);
}
mkdirSync(media, { recursive: true });
if (also) mkdirSync(also, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1720, height: 760 }, deviceScaleFactor: 1 })
).newPage();

const url = `http://127.0.0.1:8787/ultrawide.html?v14=${Date.now()}`;
await page.goto(url, { waitUntil: "networkidle" });
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(700);

const dump = await page.evaluate(() => {
  const tickers = [...document.querySelectorAll(".uw-footer-ticker")];
  const scans = [...document.querySelectorAll(".uw-footer-scan")];
  return {
    footerTickers: tickers.length,
    footerScans: scans.length,
    headerScans: document.querySelectorAll(".uw-header-scan").length,
    stutter: !!document.querySelector(".uw-footer-stutter"),
    tickerAnims: tickers.map((el) => getComputedStyle(el).animationName),
    tickerDelays: tickers.map((el) => getComputedStyle(el).animationDelay),
    emberAnim: document.querySelector(".uw-footer-ember")
      ? getComputedStyle(document.querySelector(".uw-footer-ember")).animationName
      : null,
    rain: document.querySelectorAll(".uw-rain").length,
    seamlessTrack: !!document.querySelector(".uw-footer-ticker-track"),
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
});
await page.waitForTimeout(450);

const stage = await page.locator("#uw-stage").boundingBox();
const out = "restore-final-v14-crossfade-static.png";
const primary = resolve(media, out);
await page.screenshot({ path: primary, clip: stage, type: "png" });
console.log("wrote", primary);

await page.waitForTimeout(900);
const motion = resolve(media, "restore-final-v14-crossfade-motion-frame.png");
await page.screenshot({ path: motion, clip: stage, type: "png" });
console.log("wrote", motion);

if (also) {
  copyFileSync(primary, resolve(also, out));
  copyFileSync(motion, resolve(also, "restore-final-v14-crossfade-motion-frame.png"));
  console.log("copied to", also);
}

await browser.close();
