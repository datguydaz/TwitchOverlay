import { chromium } from "playwright";
import { resolve } from "node:path";
import { mkdirSync } from "node:fs";

const ts = process.env.PROOF_TS;
const mediaStore = process.env.MEDIA_STORE;
mkdirSync(mediaStore, { recursive: true });
mkdirSync("_proofs", { recursive: true });

const browser = await chromium.launch({ headless: true });

// Ultrawide top bar: follower/sub in corners, no SAMPLE
{
  const page = await (
    await browser.newContext({ viewport: { width: 1720, height: 720 }, deviceScaleFactor: 1 })
  ).newPage();
  await page.goto("http://127.0.0.1:8787/ultrawide.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const check = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      follower: document.getElementById("uw-follower-name")?.textContent,
      subscriber: document.getElementById("uw-subscriber-name")?.textContent,
      sample: /SAMPLE/i.test(text),
      fieldNet: /FIELD NET/i.test(text),
      topHasFollow: !!document.querySelector("#uw-top #uw-follower"),
    };
  });
  console.log("uw", JSON.stringify(check));
  const name = `avatar-proof-${ts}-topbar-social.png`;
  await page.screenshot({ path: resolve(mediaStore, name), type: "png" });
  await page.screenshot({ path: resolve("_proofs", name), type: "png" });
  console.log("wrote", resolve(mediaStore, name));
  await page.close();
}

// Avatar vest + talk nod
{
  const page = await (
    await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 })
  ).newPage();
  await page.goto("http://127.0.0.1:8787/avatar.html", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    document.body.style.background = "radial-gradient(circle at 40% 30%, #2a2e2a, #0c0e0c 70%)";
    const r = document.querySelector(".avatar-root");
    if (r) {
      r.dataset.talk = "2";
      r.dataset.talkNod = "1";
      r.dataset.source = "demo";
    }
  });
  await page.waitForTimeout(250);
  const box = await page.locator(".avatar-root").boundingBox();
  const clip = {
    x: box.x + box.width * 0.18,
    y: box.y + box.height * 0.08,
    width: box.width * 0.64,
    height: box.height * 0.55,
  };
  const name = `avatar-proof-${ts}-charcoal-vest.png`;
  await page.screenshot({ path: resolve(mediaStore, name), clip, type: "png" });
  await page.screenshot({ path: resolve("_proofs", name), clip, type: "png" });
  console.log("wrote", resolve(mediaStore, name));
  await page.close();
}

await browser.close();
