import { chromium } from "playwright";
import { resolve } from "path";
import { mkdirSync, copyFileSync } from "fs";

const media = process.argv[2];
const also = process.argv[3];
if (!media) {
  console.error("usage: capture-restore-final-v5.mjs <media-dir> [also-copy-dir]");
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
await page.waitForTimeout(700);

const dump = await page.evaluate(() => {
  const stage = document.getElementById("uw-stage").getBoundingClientRect();
  const fol = document.querySelector("#uw-follower")?.getBoundingClientRect();
  const sub = document.querySelector("#uw-subscriber")?.getBoundingClientRect();
  const well = document.querySelector("#uw-follower .uw-glass-well")?.getBoundingClientRect();
  const status = document.querySelector("#uw-bottom-status");
  const statusFace = status?.querySelector(".uw-text-face")?.getBoundingClientRect();
  const statusBox = status?.getBoundingClientRect();
  const name = document.querySelector(".uw-stencil .uw-text-face")?.getBoundingClientRect();
  const mid = stage.left + stage.width / 2;
  const body = document.querySelector(".uw-wall-header")?.getBoundingClientRect();
  return {
    hold: document.body.innerText.includes("HOLD THE LINE"),
    utilLamp: !!document.querySelector(".uw-util-lamp"),
    statusLed: !!document.querySelector(".uw-status-led, .uw-status-fixture"),
    nameAnim: getComputedStyle(document.querySelector(".uw-stencil .uw-text-face")).animationName,
    nameCenterDelta: Math.round(((name?.left || 0) + (name?.width || 0) / 2) - mid),
    statusTextAlign: getComputedStyle(status).textAlign,
    statusPad: getComputedStyle(status).padding,
    statusTextCenterDelta: statusFace && statusBox
      ? Math.round((statusFace.left + statusFace.width / 2) - (statusBox.left + statusBox.width / 2))
      : null,
    folEdge: Math.round((fol?.left || 0) - (body?.left || 0)),
    subEdge: Math.round((body?.right || 0) - (sub?.right || 0)),
    wellH: Math.round(well?.height || 0),
    bindings: {
      fol: !!document.getElementById("uw-follower-name"),
      sub: !!document.getElementById("uw-subscriber-name"),
    },
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
});
await page.waitForTimeout(400);

const outName = "restore-final-v5-nameplate-polish-static.png";
const stage = await page.locator("#uw-stage").boundingBox();
const primary = resolve(media, outName);
await page.screenshot({ path: primary, clip: stage, type: "png" });
console.log("wrote", primary);

const alias = resolve(media, "avatar-proof-20261111-restore-final-v5-nameplate-polish-static.png");
await page.screenshot({ path: alias, clip: stage, type: "png" });
console.log("wrote", alias);

if (also) {
  copyFileSync(primary, resolve(also, outName));
  copyFileSync(alias, resolve(also, "avatar-proof-20261111-restore-final-v5-nameplate-polish-static.png"));
  console.log("copied to", also);
}

await browser.close();
