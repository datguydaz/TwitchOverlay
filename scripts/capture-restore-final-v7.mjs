import { chromium } from "playwright";
import { resolve } from "path";
import { mkdirSync, copyFileSync } from "fs";

const media = process.argv[2];
const also = process.argv[3];
if (!media) {
  console.error("usage: capture-restore-final-v7.mjs <media-dir> [also-copy-dir]");
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
  const rainCss = document.querySelectorAll(".uw-rain").length;
  const rainBg = [...document.querySelectorAll(".uw-bar")].map((el) => {
    const rain = el.querySelector(".uw-rain");
    return rain ? getComputedStyle(rain).backgroundImage : "none";
  });
  // Sample top bar for repeating stripe signature (CSS rain used repeating-linear-gradient)
  const top = document.querySelector("#uw-top");
  const layers = top
    ? [...top.querySelectorAll("*")].slice(0, 20).map((el) => ({
        cls: el.className?.toString?.().slice(0, 40),
        bg: getComputedStyle(el).backgroundImage.slice(0, 80),
      }))
    : [];
  return {
    cssRainEls: rainCss,
    rainBg,
    footerRail: !!document.querySelector(".uw-footer-rail"),
    footerEmbers: document.querySelectorAll(".uw-footer-ember").length,
    statusText: document.body.innerText.includes("ZONE THREAT"),
    statusEl: !!document.querySelector("#uw-bottom-status, .uw-status"),
    repeatingGradients: layers.filter((l) => /repeating-linear/i.test(l.bg)).map((l) => l.cls),
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
  const bot = document.getElementById("uw-bottom");
  bot.dataset.smoke = "1";
  bot.dataset.sparks = "l";
  bot.dataset.footerPulse = "1";
});
await page.waitForTimeout(450);

const stage = await page.locator("#uw-stage").boundingBox();
const out = "restore-final-v7-rain-bottom-static.png";
const primary = resolve(media, out);
await page.screenshot({ path: primary, clip: stage, type: "png" });
console.log("wrote", primary);

await page.waitForTimeout(700);
const motion = resolve(media, "restore-final-v7-rain-bottom-motion-frame.png");
await page.screenshot({ path: motion, clip: stage, type: "png" });
console.log("wrote", motion);

if (also) {
  copyFileSync(primary, resolve(also, out));
  copyFileSync(motion, resolve(also, "restore-final-v7-rain-bottom-motion-frame.png"));
  console.log("copied to", also);
}

await browser.close();
