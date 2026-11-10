import { chromium } from "playwright";
import { resolve } from "node:path";
import { mkdirSync } from "node:fs";

const ts = process.env.PROOF_TS;
const mediaStore = process.env.MEDIA_STORE;
mkdirSync(mediaStore, { recursive: true });
mkdirSync("_proofs", { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 })
).newPage();
await page.goto("http://127.0.0.1:8787/avatar.html", { waitUntil: "networkidle" });
await page.evaluate(() => {
  document.body.style.background = "radial-gradient(circle at 40% 30%, #3a4030, #121410 70%)";
});
await page.waitForTimeout(350);

const checks = await page.evaluate(() => {
  const svg = document.querySelector(".avatar-root svg")?.innerHTML || "";
  return {
    mice: (svg.match(/id="prop-mouse"/g) || []).length,
    lmb: svg.includes('id="mouse-lmb"'),
    rmb: svg.includes('id="mouse-rmb"'),
    deskLights: /desk-lights|eq-light/.test(svg),
    slots: (svg.match(/id="kb-s\d+"/g) || []).length,
  };
});
console.log("checks", JSON.stringify(checks));

const box = await page.locator(".avatar-root").boundingBox();
const clip = {
  x: box.x + box.width * 0.05,
  y: box.y + box.height * 0.5,
  width: box.width * 0.9,
  height: box.height * 0.42,
};

// Amber idle mouse (no desk dots) + hand on D slot (12)
await page.evaluate(() => {
  const r = document.querySelector(".avatar-root");
  if (!r) return;
  r.dataset.mouseL = "0";
  r.dataset.mouseR = "0";
  r.dataset.key = "1";
  r.dataset.keySlot = "12";
  r.dataset.active = "1";
  r.dataset.source = "demo";
  const hand = r.querySelector("#hand-left");
  if (hand) {
    // slot 12 ≈ (107, 270.5) vs home (128, 248)
    hand.style.transform = "translate(-21px, 28.5px)";
  }
  r.querySelector("#kb-s12")?.setAttribute("data-pressed", "1");
});
await page.waitForTimeout(150);
const nameA = `avatar-proof-${ts}-keygrid-hold.png`;
await page.screenshot({ path: resolve(mediaStore, nameA), clip, type: "png" });
await page.screenshot({ path: resolve("_proofs", nameA), clip, type: "png" });
console.log("wrote", resolve(mediaStore, nameA));

// LMB dark / RMB amber — zoom mouse
const mouseClip = {
  x: box.x + box.width * 0.48,
  y: box.y + box.height * 0.52,
  width: box.width * 0.45,
  height: box.height * 0.38,
};
await page.evaluate(() => {
  const r = document.querySelector(".avatar-root");
  if (!r) return;
  r.dataset.key = "0";
  r.dataset.mouseL = "1";
  r.dataset.mouseR = "0";
  const hand = r.querySelector("#hand-left");
  if (hand) hand.style.transform = "translate(0px, 0px)";
  r.querySelectorAll(".kb-key[data-pressed]").forEach((el) => el.removeAttribute("data-pressed"));
  const lmb = r.querySelector("#mouse-lmb");
  const rmb = r.querySelector("#mouse-rmb");
  if (lmb) lmb.style.fill = "#0e100c";
  if (rmb) rmb.style.fill = "#c7923a";
});
await page.waitForTimeout(120);
const nameB = `avatar-proof-${ts}-mouse-lmb.png`;
await page.screenshot({ path: resolve(mediaStore, nameB), clip: mouseClip, type: "png" });
await page.screenshot({ path: resolve("_proofs", nameB), clip: mouseClip, type: "png" });
console.log("wrote", resolve(mediaStore, nameB));

await browser.close();
