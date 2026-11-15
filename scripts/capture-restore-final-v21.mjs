import { chromium } from "playwright";
import { resolve } from "path";
import { mkdirSync, copyFileSync } from "fs";

const media = process.argv[2];
const also = process.argv[3];
if (!media) {
  console.error("usage: capture-restore-final-v21.mjs <media-dir> [also-copy-dir]");
  process.exit(1);
}
mkdirSync(media, { recursive: true });
if (also) mkdirSync(also, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1720, height: 760 }, deviceScaleFactor: 1 })
).newPage();

const url = `http://127.0.0.1:8787/ultrawide.html?v21=${Date.now()}`;
await page.goto(url, { waitUntil: "networkidle" });
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(700);

await page.addStyleTag({ content: "html,body{background:#070706!important}" });

async function measure(names) {
  return page.evaluate((pair) => {
    const s = document.getElementById("uw-stage");
    s.dataset.atm = "on";
    s.dataset.vfx = "on";
    s.dataset.textFx = "on";
    document.getElementById("uw-follower-name").textContent = pair[0];
    document.getElementById("uw-subscriber-name").textContent = pair[1];
    document.getElementById("uw-top").dataset.headerPulse = "1";
    document.getElementById("uw-bottom").dataset.footerPulse = "1";

    const topBox = document.getElementById("uw-top").getBoundingClientRect();
    const meas = (id) => {
      const el = document.getElementById(id);
      const slot = el.parentElement.getBoundingClientRect();
      const well = el.querySelector(".uw-glass-well").getBoundingClientRect();
      const label = el.querySelector(".uw-glass-label");
      const name = el.querySelector(".uw-glass-name");
      const rg = document.createRange();
      rg.selectNodeContents(name);
      const glyphs = rg.getBoundingClientRect();
      const rl = document.createRange();
      rl.selectNodeContents(label);
      return {
        labelVisible: label.textContent.trim().length > 0 && getComputedStyle(label).display !== "none",
        labelText: label.textContent.trim(),
        wellW: Math.round(well.width),
        glyphW: Math.round(glyphs.width),
        padAfter: Math.round(id === "uw-follower" ? well.right - glyphs.right : glyphs.left - well.left),
        outerFlush:
          id === "uw-follower"
            ? Math.abs(well.left - topBox.left) < 2
            : Math.abs(topBox.right - well.right) < 2,
        ratio: +(well.width / slot.width).toFixed(3),
        readoutW: Math.round(el.getBoundingClientRect().width),
        labelGlyphW: Math.round(rl.getBoundingClientRect().width),
        nameCssW: getComputedStyle(name).width,
        wellCssW: getComputedStyle(el.querySelector(".uw-glass-well")).width,
      };
    };
    return { fol: meas("uw-follower"), sub: meas("uw-subscriber") };
  }, names);
}

const long = await measure(["ZONE_SCOUT_LONGER", "RAID_READY_LONGER"]);
console.log("long", JSON.stringify(long, null, 2));
const short = await measure(["BOB", "KIT"]);
console.log("short", JSON.stringify(short, null, 2));

// restore long names for proof shot
await measure(["ZONE_SCOUT_LONGER", "RAID_READY_LONGER"]);
await page.waitForTimeout(350);

const stage = await page.locator("#uw-stage").boundingBox();
const out = "restore-final-v21-hug-width-static.png";
const primary = resolve(media, out);
await page.screenshot({ path: primary, clip: stage, type: "png" });
console.log("wrote", primary);

const topBox = await page.locator("#uw-top").boundingBox();
const topCrop = resolve(media, "v21-topbar-crop.png");
await page.screenshot({ path: topCrop, clip: topBox, type: "png" });
console.log("wrote", topCrop);

if (also) {
  copyFileSync(primary, resolve(also, out));
  copyFileSync(topCrop, resolve(also, "v21-topbar-crop.png"));
  console.log("copied to", also);
}

await browser.close();
