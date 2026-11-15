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
const check = await page.evaluate(() => {
  const svg = document.querySelector(".avatar-root svg")?.innerHTML || "";
  const head = svg.match(/id="layer-head"[\s\S]*?(?=<g id="prop-|<g id="hand-|$)/)?.[0] || "";
  return {
    headHasAmber: head.includes("#c7923a"),
    visorStroke: /x="162"[^>]*stroke="([^"]+)"/.exec(head)?.[1] || null,
  };
});
console.log("check", JSON.stringify(check));
const box = await page.locator(".avatar-root").boundingBox();
const clip = {
  x: box.x + box.width * 0.22,
  y: box.y + box.height * 0.04,
  width: box.width * 0.56,
  height: box.height * 0.55,
};
const name = `avatar-proof-${ts}-no-brow.png`;
await page.screenshot({ path: resolve(mediaStore, name), clip, type: "png" });
await page.screenshot({ path: resolve("_proofs", name), clip, type: "png" });
console.log("wrote", resolve(mediaStore, name));
await browser.close();
