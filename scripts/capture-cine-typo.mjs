import { chromium } from "playwright";
import { resolve } from "path";
import { mkdirSync, writeFileSync } from "fs";

const media = process.argv[2];
if (!media) {
  console.error("usage: capture-cine-typo.mjs <media-dir>");
  process.exit(1);
}
mkdirSync(media, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1720, height: 760 }, deviceScaleFactor: 1 })
).newPage();

async function shot(suffix) {
  const f = resolve(media, `avatar-proof-20261111-cine-typo-${suffix}.png`);
  const stage = await page.locator("#uw-stage").boundingBox();
  await page.screenshot({ path: f, clip: stage, type: "png" });
  console.log("wrote", f);
}

await page.goto("http://127.0.0.1:8787/ultrawide.html", { waitUntil: "networkidle" });
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(600);

const dump = await page.evaluate(async () => {
  const css = await (await fetch([...document.querySelectorAll('link[rel=stylesheet]')].find((l) => l.href.includes("ultrawide")).href)).text();
  return {
    concreteRefs: (css.match(/cinematic-|cracked-concrete|stencil-wall|rebar|tex-concrete|tex-peel/gi) || []).length,
    hasSlab: !!document.querySelector(".uw-steel-sign,.uw-stencil-plate,.uw-hold-wall,.uw-mat-base"),
    hasIdBlock: !!document.querySelector(".uw-id-block"),
    hasReadout: !!document.querySelector(".uw-readout"),
    hasGoal: !!document.querySelector(".uw-goal,[data-goal]"),
    idSize: getComputedStyle(document.querySelector(".uw-stencil .uw-text-face")).fontSize,
    holdSize: getComputedStyle(document.querySelector("#uw-bottom-text .uw-text-face")).fontSize,
    barBg: getComputedStyle(document.querySelector(".uw-bar")).backgroundImage.slice(0, 120),
  };
});
console.log(JSON.stringify(dump, null, 2));

await page.addStyleTag({ content: "html,body{background:#070706!important}" });

// static — FX off
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
  document.querySelectorAll(".uw-readout,.uw-glass").forEach((el) => delete el.dataset.socialFx);
  document.getElementById("uw-follower-name").textContent = "ZONE_SCOUT";
  document.getElementById("uw-subscriber-name").textContent = "RAID_READY";
});
await page.waitForTimeout(150);
await shot("static");

// animated 15s
await page.evaluate(() => {
  const s = document.getElementById("uw-stage");
  s.dataset.atm = "on";
  s.dataset.vfx = "on";
  s.dataset.textFx = "on";
  document.getElementById("uw-follower-name").textContent = "ZONE_SCOUT";
  document.getElementById("uw-subscriber-name").textContent = "RAID_READY";
});
await page.waitForTimeout(15000);
const note = await page.evaluate(() => {
  const stage = document.getElementById("uw-stage");
  return {
    atm: stage.dataset.atm,
    textFx: stage.dataset.textFx,
    glassScan: getComputedStyle(document.querySelector(".uw-glass-scan")).animationName,
    lampAnim: getComputedStyle(document.querySelector(".uw-lamp-bulb")).animationName,
    opLed: getComputedStyle(document.querySelector(".uw-op-led")).animationName,
    followGlow: getComputedStyle(document.querySelector("#uw-follower .uw-glass-glow")).animationName,
  };
});
writeFileSync(resolve(media, "avatar-proof-20261111-cine-typo-animated-15s-note.txt"), JSON.stringify(note, null, 2));
console.log("animated-15s-note", JSON.stringify(note));
await shot("animated-15s-note");

// bunker mood bg
await page.addStyleTag({
  content: `html,body{background:radial-gradient(ellipse at 50% 55%, #1a1612 0%, #0c0b0a 55%, #050504 100%)!important}`,
});
await page.waitForTimeout(80);
await shot("bunker");

await browser.close();
