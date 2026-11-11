import { chromium } from "playwright";
import { resolve } from "path";
import { mkdirSync } from "fs";

const media = process.argv[2];
if (!media) {
  console.error("usage: capture-finish.mjs <media-dir>");
  process.exit(1);
}
mkdirSync(media, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1720, height: 760 }, deviceScaleFactor: 1 })
).newPage();

async function shot(suffix) {
  const f = resolve(media, `avatar-proof-20261111-finish-${suffix}.png`);
  const stage = await page.locator("#uw-stage").boundingBox();
  await page.screenshot({ path: f, clip: stage, type: "png" });
  console.log("wrote", f);
}

await page.goto("http://127.0.0.1:8787/ultrawide.html", { waitUntil: "networkidle" });
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(500);

const dump = await page.evaluate(() => {
  const hold = document.body.innerText.includes("HOLD THE LINE");
  const fol = document.querySelector("#uw-follower");
  const sub = document.querySelector("#uw-subscriber");
  return {
    holdGone: !hold && !document.querySelector(".uw-hold-line,#uw-bottom-text"),
    status: document.querySelector("#uw-bottom-status .uw-text-face")?.textContent,
    folW: fol ? getComputedStyle(fol).width : null,
    folPad: fol ? getComputedStyle(fol).padding : null,
    nameSize: getComputedStyle(document.querySelector(".uw-glass-name")).fontSize,
    labelSize: getComputedStyle(document.querySelector(".uw-glass-label")).fontSize,
    equal: fol && sub ? getComputedStyle(fol).width === getComputedStyle(sub).width : false,
    id: document.querySelector("[data-streamer-name]")?.textContent,
  };
});
console.log(JSON.stringify(dump, null, 2));

await page.addStyleTag({ content: "html,body{background:#070706!important}" });

await page.evaluate(() => {
  const s = document.getElementById("uw-stage");
  s.dataset.atm = "off";
  s.dataset.vfx = "off";
  s.dataset.textFx = "off";
  document.querySelectorAll(".uw-readout").forEach((el) => delete el.dataset.socialFx);
  document.getElementById("uw-follower-name").textContent = "ZONE_SCOUT";
  document.getElementById("uw-subscriber-name").textContent = "RAID_READY";
});
await page.waitForTimeout(120);
await shot("static");

await page.evaluate(() => {
  document.getElementById("uw-stage").dataset.textFx = "on";
  document.getElementById("uw-stage").dataset.atm = "on";
  delete document.getElementById("uw-subscriber").dataset.socialFx;
  document.getElementById("uw-subscriber-name").textContent = "RAID_READY";
  const el = document.getElementById("uw-follower");
  document.getElementById("uw-follower-name").textContent = "ZONE_SCOUT";
  el.dataset.socialFx = "settle";
});
await page.waitForTimeout(100);
await shot("follow");

await page.evaluate(() => {
  delete document.getElementById("uw-follower").dataset.socialFx;
  document.getElementById("uw-follower-name").textContent = "ZONE_SCOUT";
  const el = document.getElementById("uw-subscriber");
  document.getElementById("uw-subscriber-name").textContent = "RAID_READY";
  el.dataset.socialFx = "settle";
});
await page.waitForTimeout(100);
await shot("sub");

await page.addStyleTag({
  content: `html,body{background:radial-gradient(ellipse at 50% 55%, #1a1612 0%, #0c0b0a 55%, #050504 100%)!important}`,
});
await page.evaluate(() => {
  document.querySelectorAll(".uw-readout").forEach((el) => delete el.dataset.socialFx);
  document.getElementById("uw-stage").dataset.atm = "on";
  document.getElementById("uw-stage").dataset.textFx = "on";
  document.getElementById("uw-follower-name").textContent = "ZONE_SCOUT";
  document.getElementById("uw-subscriber-name").textContent = "RAID_READY";
});
await page.waitForTimeout(120);
await shot("bunker");

await browser.close();
