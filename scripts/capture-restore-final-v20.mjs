import { chromium } from "playwright";
import { resolve } from "path";
import { mkdirSync, copyFileSync } from "fs";

const media = process.argv[2];
const also = process.argv[3];
if (!media) {
  console.error("usage: capture-restore-final-v20.mjs <media-dir> [also-copy-dir]");
  process.exit(1);
}
mkdirSync(media, { recursive: true });
if (also) mkdirSync(also, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1720, height: 760 }, deviceScaleFactor: 1 })
).newPage();

const url = `http://127.0.0.1:8787/ultrawide.html?v20=${Date.now()}`;
await page.goto(url, { waitUntil: "networkidle" });
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(700);

await page.addStyleTag({ content: "html,body{background:#070706!important}" });
const metrics = await page.evaluate(() => {
  const s = document.getElementById("uw-stage");
  s.dataset.atm = "on";
  s.dataset.vfx = "on";
  s.dataset.textFx = "on";
  document.getElementById("uw-follower-name").textContent = "ZONE_SCOUT_LONGER";
  document.getElementById("uw-subscriber-name").textContent = "RAID_READY_LONGER";
  const top = document.getElementById("uw-top");
  top.dataset.headerPulse = "1";
  document.getElementById("uw-bottom").dataset.footerPulse = "1";

  const topBox = top.getBoundingClientRect();
  const folSlot = document.getElementById("uw-follower-slot").getBoundingClientRect();
  const subSlot = document.getElementById("uw-subscriber-slot").getBoundingClientRect();
  const folWell = document.querySelector("#uw-follower .uw-glass-well").getBoundingClientRect();
  const subWell = document.querySelector("#uw-subscriber .uw-glass-well").getBoundingClientRect();
  const name = document.getElementById("uw-follower-name");
  const range = document.createRange();
  range.selectNodeContents(name);
  const glyphs = range.getBoundingClientRect();
  return {
    folOuterFlush: Math.abs(folWell.left - topBox.left) < 2,
    subOuterFlush: Math.abs(topBox.right - subWell.right) < 2,
    folWidthRatio: +(folWell.width / folSlot.width).toFixed(3),
    subWidthRatio: +(subWell.width / subSlot.width).toFixed(3),
    folReadWidth: getComputedStyle(document.getElementById("uw-follower")).width,
    folInnerGapPx: Math.round(folSlot.right - folWell.right),
    subInnerGapPx: Math.round(subWell.left - subSlot.left),
    folPadAfterGlyphs: Math.round(folWell.right - glyphs.right),
    wellW: Math.round(folWell.width),
  };
});
console.log(JSON.stringify(metrics, null, 2));
await page.waitForTimeout(350);

const stage = await page.locator("#uw-stage").boundingBox();
const out = "restore-final-v20-social-trim-static.png";
const primary = resolve(media, out);
await page.screenshot({ path: primary, clip: stage, type: "png" });
console.log("wrote", primary);

const topBox = await page.locator("#uw-top").boundingBox();
const topCrop = resolve(media, "v20-topbar-crop.png");
await page.screenshot({ path: topCrop, clip: topBox, type: "png" });
console.log("wrote", topCrop);

if (also) {
  copyFileSync(primary, resolve(also, out));
  copyFileSync(topCrop, resolve(also, "v20-topbar-crop.png"));
  console.log("copied to", also);
}

await browser.close();
