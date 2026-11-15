import { chromium } from "playwright";
import { resolve } from "path";
import { mkdirSync } from "fs";

const media = process.argv[2];
if (!media) {
  console.error("usage: capture-social-status-match.mjs <media-dir>");
  process.exit(1);
}
mkdirSync(media, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1720, height: 760 }, deviceScaleFactor: 1 })
).newPage();

await page.goto("http://127.0.0.1:8787/ultrawide.html", { waitUntil: "networkidle" });
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(600);

const dump = await page.evaluate(() => {
  const well = document.querySelector("#uw-follower .uw-glass-well");
  const status = document.querySelector("#uw-bottom-status");
  const name = document.querySelector("#uw-follower-name");
  const cs = (el) => {
    if (!el) return null;
    const s = getComputedStyle(el);
    return {
      bg: s.backgroundColor,
      border: s.border,
      font: s.fontFamily,
      size: s.fontSize,
      color: s.color,
      pad: s.padding,
    };
  };
  return {
    hold: document.body.innerText.includes("HOLD THE LINE"),
    ids: {
      fol: !!document.getElementById("uw-follower-name"),
      sub: !!document.getElementById("uw-subscriber-name"),
    },
    well: cs(well),
    status: cs(status),
    name: cs(name),
    indAmber: getComputedStyle(document.querySelector("#uw-follower .uw-glass-ind")).backgroundColor,
    statusLed: getComputedStyle(document.querySelector(".uw-status-led")).backgroundColor,
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

const stage = await page.locator("#uw-stage").boundingBox();
for (const name of [
  "restore-final-v4-social-match-static.png",
  "avatar-proof-20261111-restore-final-v4-social-match-static.png",
]) {
  const f = resolve(media, name);
  await page.screenshot({ path: f, clip: stage, type: "png" });
  console.log("wrote", f);
}

await browser.close();
