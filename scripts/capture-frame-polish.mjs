import { chromium } from "playwright";
import { resolve } from "path";

const media = process.argv[2];
const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1720, height: 760 }, deviceScaleFactor: 1 })
).newPage();

async function shot(suffix) {
  const f = resolve(media, `avatar-proof-20261111-frame-polish-${suffix}.png`);
  const stage = await page.locator("#uw-stage").boundingBox();
  await page.screenshot({ path: f, clip: stage, type: "png" });
  console.log("wrote", f);
}

await page.goto("http://127.0.0.1:8787/ultrawide.html", { waitUntil: "networkidle" });
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(500);

const dump = await page.evaluate(async () => {
  const cssLinks = [...document.querySelectorAll('link[rel="stylesheet"]')];
  let css = "";
  for (const l of cssLinks) {
    if (l.href.includes("ultrawide")) css = await (await fetch(l.href)).text();
  }
  const flakeOk = (await fetch("/textures/bunker/flaking-wear.png")).ok;
  return {
    textFx: document.getElementById("uw-stage")?.dataset.textFx,
    seamH: getComputedStyle(document.querySelector(".uw-seam")).height,
    holdColor: getComputedStyle(document.querySelector(".uw-title .uw-text-face") || document.querySelector(".uw-title")).color,
    dotted: /repeating-linear-gradient\(\s*90deg/.test(css),
    softLightFlake: (css.match(/tex-flake[\s\S]{0,120}soft-light/g) || []).length,
    flakeOk,
    name: document.querySelector("[data-streamer-name]")?.textContent,
    hold: document.querySelector("#uw-bottom-text .uw-text-face")?.textContent,
  };
});
console.log(JSON.stringify(dump, null, 2));

// static VFX + text off
await page.evaluate(() => {
  const s = document.getElementById("uw-stage");
  s.dataset.atm = "off";
  s.dataset.textFx = "off";
  document.querySelectorAll(".uw-bar").forEach((b) => {
    delete b.dataset.lamp;
    delete b.dataset.smoke;
    delete b.dataset.sparks;
  });
  document.querySelectorAll("[data-text-fx]").forEach((el) => delete el.dataset.fx);
});
await page.addStyleTag({ content: "html,body{background:#0a0a09!important}" });
await page.waitForTimeout(100);
await shot("static");

// bunker bg
await page.addStyleTag({
  content: `html,body{background:radial-gradient(ellipse at 50% 60%, #2a2420 0%, #141210 55%, #080706 100%)!important}`,
});
await page.waitForTimeout(60);
await shot("bunker");

// bright
await page.addStyleTag({
  content: `html,body{background:linear-gradient(180deg,#c8d0b8,#e8ecd8 40%,#b8c0a0)!important}`,
});
await page.waitForTimeout(60);
await shot("bright");

// text-fx moments
await page.addStyleTag({ content: "html,body{background:#0a0a09!important}" });
await page.evaluate(() => {
  const s = document.getElementById("uw-stage");
  s.dataset.atm = "off";
  s.dataset.textFx = "on";
  document.querySelector('[data-text-fx="id"]').dataset.fx = "recover";
  document.querySelector('[data-text-fx="op"]').dataset.fx = "flutter";
  document.querySelector('[data-text-fx="hold"]').dataset.fx = "lit-recover";
  document.querySelector('[data-text-fx="follow-label"]').dataset.fx = "sweep";
  document.querySelector('[data-text-fx="status"]').dataset.fx = "ghost";
});
await page.waitForTimeout(80);
await shot("text-fx");

// event sim follow/sub
await page.evaluate(() => {
  document.querySelectorAll("[data-text-fx]").forEach((el) => delete el.dataset.fx);
  document.getElementById("uw-follower-name").textContent = "ZONE_SCOUT";
  document.getElementById("uw-subscriber-name").textContent = "RAID_READY";
  document.querySelector('[data-text-fx="follow-label"]').dataset.fx = "activate";
  document.querySelector('[data-text-fx="follow-name"]').dataset.fx = "activate";
  document.querySelector('[data-text-fx="sub-label"]').dataset.fx = "activate";
  document.querySelector('[data-text-fx="sub-name"]').dataset.fx = "activate";
  document.getElementById("uw-follower").classList.add("uw-social-activate");
});
await page.waitForTimeout(80);
await shot("event-sim");

await browser.close();
