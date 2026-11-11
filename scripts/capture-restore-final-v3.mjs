import { chromium } from "playwright";
import { resolve } from "path";
import { mkdirSync } from "fs";

const media = process.argv[2];
if (!media) {
  console.error("usage: capture-restore-final-v3.mjs <media-dir>");
  process.exit(1);
}
mkdirSync(media, { recursive: true });

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
  const id = document.querySelector(".uw-id-block")?.getBoundingClientRect();
  const name = document.querySelector(".uw-stencil .uw-text-face")?.getBoundingClientRect();
  const op = document.querySelector(".uw-op-readout")?.getBoundingClientRect();
  const lamp = document.querySelector(".uw-util-lamp")?.getBoundingClientRect();
  const cage = document.querySelector(".uw-lamp-cage")?.getBoundingClientRect();
  const status = document.querySelector("#uw-bottom-status")?.getBoundingClientRect();
  const mid = stage.left + stage.width / 2;
  const bar = document.querySelector("#uw-top")?.getBoundingClientRect();
  return {
    hold: document.body.innerText.includes("HOLD THE LINE"),
    folW: Math.round(fol?.width || 0),
    folH: Math.round(fol?.height || 0),
    subW: Math.round(sub?.width || 0),
    opW: Math.round(op?.width || 0),
    opH: Math.round(op?.height || 0),
    opFs: getComputedStyle(document.querySelector(".uw-op-readout")).fontSize,
    opFont: getComputedStyle(document.querySelector(".uw-op-readout")).fontFamily,
    nameFont: getComputedStyle(document.querySelector(".uw-stencil .uw-text-face")).fontFamily,
    statusW: Math.round(status?.width || 0),
    statusH: Math.round(status?.height || 0),
    statusFs: getComputedStyle(document.querySelector("#uw-bottom-status")).fontSize,
    nameCenterDelta: Math.round(((name?.left || 0) + (name?.width || 0) / 2) - mid),
    opCenterDelta: Math.round(((op?.left || 0) + (op?.width || 0) / 2) - mid),
    lampW: Math.round(lamp?.width || 0),
    lampH: Math.round(lamp?.height || 0),
    lampInsideId: !!(lamp && id && lamp.left >= id.left - 1 && lamp.right <= id.right + 1),
    lampInsideBar: !!(lamp && bar && lamp.left >= bar.left && lamp.right <= bar.right),
    lampSquare: Math.abs((cage?.width || 0) - (cage?.height || 0)) < 1.5,
    gapFolId: Math.round((id?.left || 0) - (fol?.right || 0)),
    gapIdSub: Math.round((sub?.left || 0) - (id?.right || 0)),
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
  document.getElementById("uw-top").dataset.lamp = "recover";
});
await page.waitForTimeout(300);

const stage = await page.locator("#uw-stage").boundingBox();
for (const name of ["restore-final-v3-static.png", "avatar-proof-20261111-restore-final-v3-static.png"]) {
  const f = resolve(media, name);
  await page.screenshot({ path: f, clip: stage, type: "png" });
  console.log("wrote", f);
}

/* tight crop around nameplate for lamp proof */
const plate = await page.evaluate(() => {
  const id = document.querySelector(".uw-id-block").getBoundingClientRect();
  return { x: id.left - 48, y: id.top - 24, width: id.width + 96, height: id.height + 48 };
});
const crop = resolve(media, "restore-final-v3-nameplate-crop.png");
await page.screenshot({ path: crop, clip: plate, type: "png" });
console.log("wrote", crop);

await browser.close();
