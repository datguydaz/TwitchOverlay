import { chromium } from "playwright";
import { resolve } from "path";
import { mkdirSync, copyFileSync } from "fs";

const media = process.argv[2];
const also = process.argv[3];
if (!media) {
  console.error("usage: capture-restore-final-v9.mjs <media-dir> [also-copy-dir]");
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
await page.waitForTimeout(800);

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
  top.dataset.sparks = "r";
  const bot = document.getElementById("uw-bottom");
  bot.dataset.footerPulse = "1";
  bot.dataset.sparks = "l";
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

  const fol = document.querySelector("#uw-follower .uw-glass-well");
  const sub = document.querySelector("#uw-subscriber .uw-glass-well");
  const folName = document.querySelector("#uw-follower .uw-glass-name");
  const topBar = document.getElementById("uw-top");
  const folBox = fol.getBoundingClientRect();
  const topBox = topBar.getBoundingClientRect();
  const folCs = getComputedStyle(fol);
  const nameCs = getComputedStyle(folName);
  return {
    wellH: Math.round(folBox.height),
    barH: Math.round(topBox.height),
    wellRatio: +(folBox.height / topBox.height).toFixed(3),
    wellPad: folCs.padding,
    nameSize: nameCs.fontSize,
    folLeft: Math.round(folBox.left - topBox.left),
    subRight: Math.round(topBox.right - sub.getBoundingClientRect().right),
    edgeFlush: Math.abs(folBox.left - topBox.left) < 2 && Math.abs(topBox.right - sub.getBoundingClientRect().right) < 2,
  };
});
console.log(JSON.stringify(metrics, null, 2));
await page.waitForTimeout(400);

const stage = await page.locator("#uw-stage").boundingBox();
const out = "restore-final-v9-social-scale-static.png";
const primary = resolve(media, out);
await page.screenshot({ path: primary, clip: stage, type: "png" });
console.log("wrote", primary);

const topBox = await page.locator("#uw-top").boundingBox();
const topCrop = resolve(media, "v9-topbar-crop.png");
await page.screenshot({ path: topCrop, clip: topBox, type: "png" });
console.log("wrote", topCrop);

if (also) {
  copyFileSync(primary, resolve(also, out));
  copyFileSync(topCrop, resolve(also, "v9-topbar-crop.png"));
  console.log("copied to", also);
}

await browser.close();
