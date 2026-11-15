import { chromium } from "playwright";
import { resolve } from "node:path";
import { mkdirSync } from "node:fs";

const ts = process.env.PROOF_TS;
const mediaStore = process.env.MEDIA_STORE;
mkdirSync(mediaStore, { recursive: true });
mkdirSync("_proofs", { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1720, height: 720 }, deviceScaleFactor: 1 })
).newPage();
await page.goto("http://127.0.0.1:8787/ultrawide.html", { waitUntil: "networkidle" });
await page.waitForTimeout(400);

const check = await page.evaluate(() => {
  const f = document.getElementById("uw-follower");
  const cs = f ? getComputedStyle(f) : null;
  const bottomLeft = document.querySelector("#uw-bottom .uw-side:not(.uw-side-right)")?.textContent?.trim() || "";
  return {
    followerName: document.getElementById("uw-follower-name")?.textContent,
    hasBorder: cs ? cs.borderTopWidth !== "0px" : false,
    hasBg: cs ? cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent" : false,
    sample: /SAMPLE/i.test(document.body.innerText),
    bottomLeftEmpty: bottomLeft.length === 0,
    bottomHasOperator: /OPERATOR|AUTH/i.test(document.querySelector("#uw-bottom")?.innerText || ""),
    topCenter: document.getElementById("uw-top-text")?.textContent,
  };
});
console.log("check", JSON.stringify(check));

const name = `avatar-proof-${ts}-uw-plates.png`;
await page.screenshot({ path: resolve(mediaStore, name), type: "png" });
await page.screenshot({ path: resolve("_proofs", name), type: "png" });
console.log("wrote", resolve(mediaStore, name));
await browser.close();
