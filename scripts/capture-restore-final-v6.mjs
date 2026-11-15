import { chromium } from "playwright";
import { resolve } from "path";
import { mkdirSync, copyFileSync } from "fs";

const media = process.argv[2];
const also = process.argv[3];
if (!media) {
  console.error("usage: capture-restore-final-v6.mjs <media-dir> [also-copy-dir]");
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

const dump = await page.evaluate(() => {
  const stage = document.getElementById("uw-stage").getBoundingClientRect();
  const body = document.querySelector(".uw-wall-header")?.getBoundingClientRect();
  const fol = document.querySelector("#uw-follower")?.getBoundingClientRect();
  const sub = document.querySelector("#uw-subscriber")?.getBoundingClientRect();
  const well = document.querySelector("#uw-follower .uw-glass-well")?.getBoundingClientRect();
  const name = document.querySelector(".uw-stencil .uw-text-face")?.getBoundingClientRect();
  const op = document.querySelector(".uw-op-readout")?.getBoundingClientRect();
  const mid = stage.left + stage.width / 2;
  return {
    hold: document.body.innerText.includes("HOLD THE LINE"),
    statusText: document.body.innerText.includes("ZONE THREAT"),
    statusEl: !!document.querySelector("#uw-bottom-status, .uw-status"),
    utilLamp: !!document.querySelector(".uw-util-lamp"),
    nameCrt: !!document.querySelector(".uw-name-crt"),
    rain: document.querySelectorAll(".uw-rain").length,
    nameAnim: getComputedStyle(document.querySelector(".uw-stencil .uw-text-face")).animationName,
    opGap: Math.round((op?.top || 0) - (name?.bottom || 0)),
    nameCenterDelta: Math.round(((name?.left || 0) + (name?.width || 0) / 2) - mid),
    folEdge: Math.round((fol?.left || 0) - (body?.left || 0)),
    subEdge: Math.round((body?.right || 0) - (sub?.right || 0)),
    wellH: Math.round(well?.height || 0),
    barH: Math.round(body?.height || 0),
    wellFill: well && body ? Math.round((well.height / body.height) * 100) : 0,
    dustCanvas: !!document.querySelector("#uw-atm-dust-shared"),
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
  document.getElementById("uw-top").dataset.sparks = "r";
  document.getElementById("uw-bottom").dataset.smoke = "1";
  document.getElementById("uw-bottom").dataset.jitter = "1";
});
await page.waitForTimeout(500);

const stage = await page.locator("#uw-stage").boundingBox();
const out = "restore-final-v6-atmosphere-static.png";
const primary = resolve(media, out);
await page.screenshot({ path: primary, clip: stage, type: "png" });
console.log("wrote", primary);

const alias = resolve(media, "avatar-proof-20261111-restore-final-v6-atmosphere-static.png");
await page.screenshot({ path: alias, clip: stage, type: "png" });
console.log("wrote", alias);

/* short motion proof if supported */
try {
  const motion = resolve(media, "restore-final-v6-atmosphere-motion.webm");
  await page.evaluate(() => {
    document.getElementById("uw-top").dataset.jitter = "1";
  });
  const rec = await page.video;
  // Playwright context video needs recordVideo at context create — skip if unavailable
  if (!rec) {
    // Capture a second frame mid-CRT as motion stand-in
    await page.waitForTimeout(900);
    const mid = resolve(media, "restore-final-v6-atmosphere-motion-frame.png");
    await page.screenshot({ path: mid, clip: stage, type: "png" });
    console.log("wrote", mid);
    if (also) copyFileSync(mid, resolve(also, "restore-final-v6-atmosphere-motion-frame.png"));
  } else {
    console.log("video handle present", motion);
  }
} catch (e) {
  console.log("motion capture skip", String(e));
}

if (also) {
  copyFileSync(primary, resolve(also, out));
  copyFileSync(alias, resolve(also, "avatar-proof-20261111-restore-final-v6-atmosphere-static.png"));
  console.log("copied to", also);
}

await browser.close();
