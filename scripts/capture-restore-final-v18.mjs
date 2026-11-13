import { chromium } from "playwright";
import { resolve } from "path";
import { mkdirSync, copyFileSync } from "fs";

const media = process.argv[2];
const also = process.argv[3];
if (!media) {
  console.error("usage: capture-restore-final-v18.mjs <media-dir> [also-copy-dir]");
  process.exit(1);
}
mkdirSync(media, { recursive: true });
if (also) mkdirSync(also, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1720, height: 760 }, deviceScaleFactor: 1 })
).newPage();

const url = `http://127.0.0.1:8787/ultrawide.html?v18=${Date.now()}`;
await page.goto(url, { waitUntil: "networkidle" });
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(700);

const dump = await page.evaluate(() => {
  const glow = document.querySelector(".uw-footer-rail-glow");
  const cs = glow ? getComputedStyle(glow) : null;
  return {
    wear: !!document.querySelector(".uw-footer-wear"),
    claw: !!document.querySelector(".uw-claw-slashes"),
    impact: !!document.querySelector(".uw-impact-gouges"),
    railBreaks: document.querySelectorAll(".uw-rail-break").length,
    tickers: document.querySelectorAll(".uw-footer-ticker").length,
    scans: document.querySelectorAll(".uw-footer-scan").length,
    railMask: cs ? (cs.maskImage || cs.webkitMaskImage || "none") : null,
    rain: document.querySelectorAll(".uw-rain").length,
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
  document.getElementById("uw-bottom").dataset.footerPulse = "1";
});
await page.waitForTimeout(400);

const stage = await page.locator("#uw-stage").boundingBox();
const out = "restore-final-v18-no-scratch-static.png";
const primary = resolve(media, out);
await page.screenshot({ path: primary, clip: stage, type: "png" });
console.log("wrote", primary);

if (also) {
  copyFileSync(primary, resolve(also, out));
  console.log("copied to", also);
}

await browser.close();
