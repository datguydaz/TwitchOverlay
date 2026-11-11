import { chromium } from "playwright";
import { resolve } from "path";
import { mkdirSync } from "fs";

const media = process.argv[2];
if (!media) {
  console.error("usage: capture-restore-final-v2.mjs <media-dir>");
  process.exit(1);
}
mkdirSync(media, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1720, height: 760 }, deviceScaleFactor: 1 })
).newPage();

await page.goto("http://127.0.0.1:8787/ultrawide.html", { waitUntil: "networkidle" });
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(500);

const dump = await page.evaluate(() => {
  const stage = document.getElementById("uw-stage").getBoundingClientRect();
  const fol = document.querySelector("#uw-follower")?.getBoundingClientRect();
  const sub = document.querySelector("#uw-subscriber")?.getBoundingClientRect();
  const id = document.querySelector(".uw-id-block")?.getBoundingClientRect();
  const name = document.querySelector(".uw-stencil .uw-text-face")?.getBoundingClientRect();
  const op = document.querySelector(".uw-op-readout")?.getBoundingClientRect();
  const status = document.querySelector("#uw-bottom-status")?.getBoundingClientRect();
  const mid = stage.left + stage.width / 2;
  return {
    hold: document.body.innerText.includes("HOLD THE LINE"),
    folW: Math.round(fol?.width || 0),
    subW: Math.round(sub?.width || 0),
    statusW: Math.round(status?.width || 0),
    statusFs: getComputedStyle(document.querySelector("#uw-bottom-status")).fontSize,
    gapFolId: Math.round((id?.left || 0) - (fol?.right || 0)),
    gapIdSub: Math.round((sub?.left || 0) - (id?.right || 0)),
    edgeL: Math.round((fol?.left || 0) - stage.left),
    edgeR: Math.round(stage.right - (sub?.right || 0)),
    nameCenterDelta: Math.round(((name?.left || 0) + (name?.width || 0) / 2) - mid),
    opCenterDelta: Math.round(((op?.left || 0) + (op?.width || 0) / 2) - mid),
    idCenterDelta: Math.round(((id?.left || 0) + (id?.width || 0) / 2) - mid),
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

const f = resolve(media, "restore-final-v2-static.png");
const stage = await page.locator("#uw-stage").boundingBox();
await page.screenshot({ path: f, clip: stage, type: "png" });
console.log("wrote", f);

const alias = resolve(media, "avatar-proof-20261111-restore-final-v2-static.png");
await page.screenshot({ path: alias, clip: stage, type: "png" });
console.log("wrote", alias);

await browser.close();
