import { chromium } from "playwright";
import { resolve } from "node:path";
import { mkdirSync } from "node:fs";

const ts = process.env.PROOF_TS;
const mediaStore = process.env.MEDIA_STORE;
mkdirSync(mediaStore, { recursive: true });
mkdirSync("_proofs", { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto("http://127.0.0.1:8787/avatar.html", { waitUntil: "networkidle" });
await page.evaluate(() => {
  document.body.style.background = "radial-gradient(circle at 40% 30%, #3a4030, #121410 70%)";
});
await page.waitForTimeout(400);
const checks = await page.evaluate(() => {
  const svg = document.querySelector(".avatar-root svg")?.innerHTML || "";
  return {
    mouseIds: (svg.match(/id="prop-mouse"/g) || []).length,
    hasLeftHand: svg.includes('id="hand-left"'),
    leftLooksLikeBlob: /hand-left[\s\S]{0,200}Q116 232/.test(svg),
  };
});
console.log("checks", JSON.stringify(checks));
const box = await page.locator(".avatar-root").boundingBox();
// Tight crop on desk/hands so mice are obvious
const clip = {
  x: box.x + box.width * 0.08,
  y: box.y + box.height * 0.55,
  width: box.width * 0.84,
  height: box.height * 0.38,
};
const name = `avatar-proof-${ts}-one-mouse.png`;
await page.screenshot({ path: resolve(mediaStore, name), clip, type: "png" });
await page.screenshot({ path: resolve("_proofs", name), clip, type: "png" });
console.log("wrote", resolve(mediaStore, name));
await browser.close();
