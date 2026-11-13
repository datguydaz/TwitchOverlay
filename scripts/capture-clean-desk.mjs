import { chromium } from "playwright";
import { resolve } from "node:path";
import { mkdirSync } from "node:fs";
const ts = process.env.PROOF_TS;
const mediaStore = process.env.MEDIA_STORE;
mkdirSync(mediaStore, { recursive: true });
mkdirSync("_proofs", { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 })).newPage();
await page.goto("http://127.0.0.1:8787/avatar.html", { waitUntil: "networkidle" });
await page.evaluate(() => { document.body.style.background = "radial-gradient(circle at 40% 30%, #3a4030, #121410 70%)"; });
await page.waitForTimeout(400);
const svg = await page.evaluate(() => document.querySelector(".avatar-root svg")?.innerHTML || "");
console.log(JSON.stringify({
  hasLabelBox: /x="340" y="248" width="32"/.test(svg),
  hasDashLine: /stroke-dasharray="5 3 2 3"/.test(svg),
  lights: (svg.match(/eq-light/g) || []).length,
}));
const box = await page.locator(".avatar-root").boundingBox();
const name = `avatar-proof-${ts}-clean-desk.png`;
const clip = { x: box.x + box.width * 0.42, y: box.y + box.height * 0.50, width: box.width * 0.52, height: box.height * 0.40 };
await page.screenshot({ path: resolve(mediaStore, name), clip, type: "png" });
await page.screenshot({ path: resolve("_proofs", name), clip, type: "png" });
console.log("wrote", resolve(mediaStore, name));
await browser.close();
