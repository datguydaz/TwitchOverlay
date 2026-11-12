import { chromium } from "playwright";
import { resolve } from "path";
import { mkdirSync, copyFileSync } from "fs";

const media = process.argv[2];
const also = process.argv[3];
if (!media) {
  console.error(
    "usage: capture-restore-final-v21-social-longer.mjs <media-dir> [also-copy-dir]",
  );
  process.exit(1);
}
mkdirSync(media, { recursive: true });
if (also) mkdirSync(also, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1720, height: 180 }, deviceScaleFactor: 1 })
).newPage();

const url = `http://127.0.0.1:8787/ultrawide-top.html?socialLonger=${Date.now()}`;
await page.goto(url, { waitUntil: "networkidle" });
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(500);

await page.addStyleTag({ content: "html,body{background:#070706!important}" });
const metrics = await page.evaluate(() => {
  const s = document.getElementById("uw-stage");
  s.dataset.atm = "on";
  s.dataset.vfx = "on";
  s.dataset.textFx = "on";
  document.getElementById("uw-follower-name").textContent = "RYSEABOVEIT";
  document.getElementById("uw-subscriber-name").textContent = "ACTYR:[6]";
  document.getElementById("uw-top").dataset.headerPulse = "1";

  const topBox = document.getElementById("uw-top").getBoundingClientRect();
  const meas = (id) => {
    const el = document.getElementById(id);
    const slot = el.parentElement.getBoundingClientRect();
    const wellEl = el.querySelector(".uw-glass-well");
    const well = wellEl.getBoundingClientRect();
    const name = el.querySelector(".uw-glass-name");
    const rg = document.createRange();
    rg.selectNodeContents(name);
    const g = rg.getBoundingClientRect();
    const cs = getComputedStyle(wellEl);
    return {
      name: name.textContent,
      wellW: Math.round(well.width),
      glyphW: Math.round(g.width),
      padAfter: Math.round(
        id === "uw-follower" ? well.right - g.right : g.left - well.left,
      ),
      padL: cs.paddingLeft,
      padR: cs.paddingRight,
      minW: cs.minWidth,
      outerFlush:
        id === "uw-follower"
          ? Math.abs(well.left - topBox.left) < 2
          : Math.abs(topBox.right - well.right) < 2,
      ratio: +(well.width / slot.width).toFixed(3),
    };
  };
  const fol = meas("uw-follower");
  const sub = meas("uw-subscriber");
  return {
    mode: document.body.dataset.uwMode,
    fol,
    sub,
    actyrShorter: sub.wellW < fol.wellW,
    delta: fol.wellW - sub.wellW,
  };
});
console.log(JSON.stringify(metrics, null, 2));
if (!metrics.actyrShorter) {
  console.error("FAIL: ACTYR not shorter than RYSEABOVEIT");
  process.exitCode = 1;
}

await page.waitForTimeout(350);
const stage = await page.locator("#uw-stage").boundingBox();
const out = "restore-final-v21-social-longer-static.png";
const primary = resolve(media, out);
await page.screenshot({ path: primary, clip: stage, type: "png" });
console.log("wrote", primary);

if (also) {
  copyFileSync(primary, resolve(also, out));
  console.log("copied to", also);
}

await browser.close();
