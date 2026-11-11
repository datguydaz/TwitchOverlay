import { chromium } from "playwright";
import { resolve } from "path";
import { mkdirSync } from "fs";

const media = process.argv[2];
if (!media) {
  console.error("usage: capture-restore-amp-vfx.mjs <media-dir>");
  process.exit(1);
}
mkdirSync(media, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1720, height: 760 }, deviceScaleFactor: 1 })
).newPage();

async function shot(suffix) {
  const f = resolve(media, `avatar-proof-20261111-restore-amp-vfx-${suffix}.png`);
  const stage = await page.locator("#uw-stage").boundingBox();
  await page.screenshot({ path: f, clip: stage, type: "png" });
  console.log("wrote", f);
}

await page.goto("http://127.0.0.1:8787/ultrawide.html", { waitUntil: "networkidle" });
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(500);

const dump = await page.evaluate(() => {
  const fol = document.querySelector("#uw-follower");
  return {
    hold: document.querySelector("#uw-bottom-text .uw-text-face")?.textContent,
    bolts: document.querySelectorAll(".uw-readout-bolt").length,
    clip: getComputedStyle(fol).clipPath,
    border: getComputedStyle(fol).border,
    folW: getComputedStyle(fol).width,
    haze: !!document.querySelector(".uw-bar-haze"),
    name: document.querySelector("[data-streamer-name]")?.textContent,
  };
});
console.log(JSON.stringify(dump, null, 2));

await page.addStyleTag({ content: "html,body{background:#070706!important}" });
await page.evaluate(() => {
  const s = document.getElementById("uw-stage");
  s.dataset.atm = "on";
  s.dataset.vfx = "on";
  s.dataset.textFx = "on";
  document.getElementById("uw-follower-name").textContent = "ZONE_SCOUT";
  document.getElementById("uw-subscriber-name").textContent = "RAID_READY";
});
await page.waitForTimeout(250);
await shot("static");

await page.addStyleTag({
  content: `html,body{background:radial-gradient(ellipse at 50% 55%, #1a1612 0%, #0c0b0a 55%, #050504 100%)!important}`,
});
await page.evaluate(() => {
  document.getElementById("uw-top").dataset.lamp = "recover";
  document.getElementById("uw-bottom").dataset.smoke = "1";
  document.getElementById("uw-bottom").dataset.sparks = "l";
});
await page.waitForTimeout(150);
await shot("bunker");

await browser.close();
