import { chromium } from "playwright";
import { resolve } from "path";
import { mkdirSync } from "fs";

const media = process.argv[2];
if (!media) {
  console.error("usage: capture-signage.mjs <media-dir>");
  process.exit(1);
}
mkdirSync(media, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1720, height: 760 }, deviceScaleFactor: 1 })
).newPage();

async function shot(suffix) {
  const f = resolve(media, `avatar-proof-20261111-signage-${suffix}.png`);
  const stage = await page.locator("#uw-stage").boundingBox();
  await page.screenshot({ path: f, clip: stage, type: "png" });
  console.log("wrote", f);
}

await page.goto("http://127.0.0.1:8787/ultrawide.html", { waitUntil: "networkidle" });
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(600);

const dump = await page.evaluate(async () => {
  const cssLinks = [...document.querySelectorAll('link[rel="stylesheet"]')];
  let css = "";
  for (const l of cssLinks) {
    if (l.href.includes("ultrawide")) css = await (await fetch(l.href)).text();
  }
  return {
    hasGlass: !!document.querySelector(".uw-glass"),
    hasSteel: !!document.querySelector(".uw-steel-sign"),
    hasHoldStrip: !!document.querySelector(".uw-hold-strip"),
    hasUtilLamp: !!document.querySelector(".uw-util-lamp"),
    hasGoal: !!document.querySelector(".uw-goal, #uw-goal-follow, [data-goal]"),
    goalsInCss: /goal-meter|\.uw-goal/.test(css),
    greenHits: (css.match(/#0f0|lime|olive|#4a5|#6b8|#7a9|#8fa|#3f5|#2e4/gi) || []).length,
    name: document.querySelector("[data-streamer-name]")?.textContent,
    hold: document.querySelector("#uw-bottom-text .uw-text-face")?.textContent,
    followLabel: document.querySelector("#uw-follower .uw-glass-label")?.textContent,
    subLabel: document.querySelector("#uw-subscriber .uw-glass-label")?.textContent,
  };
});
console.log(JSON.stringify(dump, null, 2));

// static — VFX + text FX off
await page.evaluate(() => {
  const s = document.getElementById("uw-stage");
  s.dataset.atm = "off";
  s.dataset.vfx = "off";
  s.dataset.textFx = "off";
  document.querySelectorAll(".uw-bar").forEach((b) => {
    delete b.dataset.lamp;
    delete b.dataset.smoke;
    delete b.dataset.sparks;
  });
  document.querySelectorAll("[data-text-fx]").forEach((el) => delete el.dataset.fx);
  document.querySelectorAll(".uw-glass").forEach((el) => delete el.dataset.socialFx);
});
await page.addStyleTag({ content: "html,body{background:#0a0a09!important}" });
await page.waitForTimeout(120);
await shot("static");

// bunker atmosphere bg
await page.addStyleTag({
  content: `html,body{background:radial-gradient(ellipse at 50% 60%, #2a2420 0%, #141210 55%, #080706 100%)!important}`,
});
await page.waitForTimeout(80);
await shot("bunker");

await page.addStyleTag({ content: "html,body{background:#0a0a09!important}" });

// follow event mid-settle
await page.evaluate(() => {
  const s = document.getElementById("uw-stage");
  s.dataset.atm = "off";
  s.dataset.vfx = "off";
  s.dataset.textFx = "on";
  const el = document.getElementById("uw-follower");
  const name = document.getElementById("uw-follower-name");
  name.textContent = "ZONE_SCOUT";
  el.dataset.socialFx = "settle";
  document.getElementById("uw-subscriber").dataset.socialFx = undefined;
  delete document.getElementById("uw-subscriber").dataset.socialFx;
});
await page.waitForTimeout(100);
await shot("follow-event");

// sub event mid-settle
await page.evaluate(() => {
  delete document.getElementById("uw-follower").dataset.socialFx;
  document.getElementById("uw-follower-name").textContent = "";
  const el = document.getElementById("uw-subscriber");
  const name = document.getElementById("uw-subscriber-name");
  name.textContent = "RAID_READY";
  el.dataset.socialFx = "settle";
});
await page.waitForTimeout(100);
await shot("sub-event");

await browser.close();
