import { chromium } from "playwright";
import { resolve } from "path";

const media = process.argv[2];
const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1720, height: 760 }, deviceScaleFactor: 1 })
).newPage();

async function shot(suffix) {
  const f = resolve(media, `avatar-proof-20261111-charcoal-frame-${suffix}.png`);
  const stage = await page.locator("#uw-stage").boundingBox();
  await page.screenshot({ path: f, clip: stage, type: "png" });
  console.log("wrote", f);
}

await page.goto("http://127.0.0.1:8787/ultrawide.html", { waitUntil: "networkidle" });
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(500);

const dump = await page.evaluate(async () => {
  const urls = [
    "/textures/bunker/soot-plate.png",
    "/textures/bunker/metal-grain.png",
    "/textures/bunker/flaking-wear.png",
    "/textures/bunker/corrosion.png",
    "/textures/bunker/water-streaks.png",
    "/textures/bunker/soot-vent.png",
  ];
  const tex = {};
  for (const u of urls) {
    try {
      const r = await fetch(u);
      tex[u] = r.ok;
    } catch {
      tex[u] = false;
    }
  }
  const css = getComputedStyle(document.getElementById("uw-stage"));
  return {
    soot: css.getPropertyValue("--uw-soot").trim(),
    charcoal: css.getPropertyValue("--uw-charcoal").trim(),
    bone: css.getPropertyValue("--uw-bone").trim(),
    amber: css.getPropertyValue("--uw-amber").trim(),
    rust: css.getPropertyValue("--uw-rust").trim(),
    edge: css.getPropertyValue("--uw-edge").trim(),
    name: document.querySelector("[data-streamer-name]")?.textContent,
    hold: document.getElementById("uw-bottom-text")?.textContent,
    greenInCss: /#2e3428|#3f4636|#55604a|olive|2a3124|3c4434/i.test(
      document.querySelector('link[href*="ultrawide"]') ? "" : "",
    ),
    tex,
  };
});
console.log(JSON.stringify(dump, null, 2));

// Probe CSS file for leftover green
const cssText = await page.evaluate(async () => {
  const links = [...document.querySelectorAll('link[rel="stylesheet"]')];
  for (const l of links) {
    if (l.href.includes("ultrawide")) {
      const r = await fetch(l.href);
      return await r.text();
    }
  }
  return "";
});
const greenHits = (cssText.match(/#2e3428|#3f4636|#55604a|#2a3124|#3c4434|#5a664c|#667256|#4a5240|#3a4234|olive/gi) || []).length;
console.log("green leftover hits in built css:", greenHits);

// 1) static VFX-off
await page.evaluate(() => {
  const stage = document.getElementById("uw-stage");
  stage.dataset.atm = "off";
  document.querySelectorAll(".uw-bar").forEach((b) => {
    delete b.dataset.lamp;
    delete b.dataset.smoke;
    delete b.dataset.sparks;
  });
});
await page.addStyleTag({ content: "html,body{background:#0a0a09!important}" });
await page.waitForTimeout(120);
await shot("static-vfx-off");

// 2) VFX on moments
await page.evaluate(() => {
  document.getElementById("uw-stage").dataset.atm = "on";
  document.getElementById("uw-top").dataset.lamp = "recover";
  document.getElementById("uw-top").dataset.sparks = "r";
  document.getElementById("uw-bottom").dataset.smoke = "1";
  document.getElementById("uw-follower").classList.add("uw-social-activate");
  document.getElementById("uw-follower-name").textContent = "ZONE_SCOUT";
  document.getElementById("uw-subscriber-name").textContent = "RAID_READY";
});
await page.waitForTimeout(80);
await shot("vfx-on");

// 3) over bunker
await page.addStyleTag({
  content: `html,body{background:
    radial-gradient(ellipse at 50% 60%, #2a2420 0%, #141210 55%, #080706 100%)!important}`,
});
await page.evaluate(() => {
  document.getElementById("uw-stage").dataset.atm = "off";
  document.querySelectorAll(".uw-bar").forEach((b) => {
    delete b.dataset.lamp;
    delete b.dataset.smoke;
    delete b.dataset.sparks;
  });
});
await page.waitForTimeout(80);
await shot("over-bunker");

// 4) over bright gameplay
await page.addStyleTag({
  content: `html,body{background:
    linear-gradient(180deg, #c8d0b8, #e8ecd8 40%, #b8c0a0)!important}`,
});
await page.waitForTimeout(80);
await shot("over-bright");

await browser.close();
