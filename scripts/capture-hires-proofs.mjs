import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const ts = process.env.PROOF_TS;
const mediaStore = process.env.MEDIA_STORE;
mkdirSync(mediaStore, { recursive: true });
mkdirSync("_proofs", { recursive: true });

const browser = await chromium.launch({ headless: true });

async function shotAvatar() {
  const ctx = await browser.newContext({
    viewport: { width: 1400, height: 1200 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:8787/avatar.html", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    document.body.style.background =
      "radial-gradient(circle at 40% 30%, #3a4030, #121410 70%)";
  });
  await page.waitForTimeout(500);
  const root = page.locator(".avatar-root");
  await root.waitFor({ state: "visible" });
  const box = await root.boundingBox();
  if (!box) throw new Error("no avatar box");
  const clip = {
    x: Math.max(0, box.x + box.width * 0.18),
    y: Math.max(0, box.y + box.height * 0.08),
    width: Math.min(box.width * 0.64, 1400),
    height: Math.min(box.height * 0.72, 1200),
  };
  const name = `avatar-proof-${ts}-hires.png`;
  const dest = resolve(mediaStore, name);
  const local = resolve("_proofs", name);
  await page.screenshot({ path: dest, clip, type: "png" });
  await page.screenshot({ path: local, clip, type: "png" });
  console.log("avatar", dest, JSON.stringify(clip));
  // Also dump SVG metrics
  const metrics = await page.evaluate(() => {
    const svg = document.querySelector(".avatar-root svg");
    const root = document.querySelector(".avatar-root");
    const r = root.getBoundingClientRect();
    return {
      viewBox: svg?.getAttribute("viewBox"),
      widthAttr: svg?.getAttribute("width"),
      heightAttr: svg?.getAttribute("height"),
      cssW: Math.round(r.width),
      cssH: Math.round(r.height),
    };
  });
  console.log("metrics", JSON.stringify(metrics));
  await ctx.close();
}

async function shotUltrawide() {
  const ctx = await browser.newContext({
    viewport: { width: 1720, height: 720 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:8787/ultrawide.html", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    // Checker behind transparent hole so letterbox bars read clearly
    document.body.style.background =
      "repeating-conic-gradient(#2a2e24 0% 25%, #1a1c18 0% 50%) 50% / 40px 40px";
  });
  await page.waitForTimeout(400);
  const name = `ultrawide-proof-${ts}-letterbox.png`;
  const dest = resolve(mediaStore, name);
  const local = resolve("_proofs", name);
  await page.screenshot({ path: dest, type: "png", fullPage: false });
  await page.screenshot({ path: local, type: "png", fullPage: false });
  console.log("ultrawide", dest);

  // Tight crop of top bar only
  const top = page.locator("#uw-top");
  await top.waitFor({ state: "visible" });
  const tbox = await top.boundingBox();
  if (tbox) {
    const tname = `ultrawide-proof-${ts}-topbar.png`;
    await page.screenshot({
      path: resolve(mediaStore, tname),
      clip: { x: tbox.x, y: tbox.y, width: Math.min(tbox.width, 1720), height: tbox.height },
      type: "png",
    });
    await page.screenshot({
      path: resolve("_proofs", tname),
      clip: { x: tbox.x, y: tbox.y, width: Math.min(tbox.width, 1720), height: tbox.height },
      type: "png",
    });
    console.log("topbar", resolve(mediaStore, tname));
  }
  await ctx.close();
}

await shotAvatar();
await shotUltrawide();
await browser.close();
