import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

const BASE = "http://127.0.0.1:8787";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
  });
  await page.goto(`${BASE}/gameplay.html`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  const path = "/cursor/stores/self/media/gameplay-alpha.png";
  await page.screenshot({ path, omitBackground: true });

  const check = await page.evaluate(async () => {
    // Draw page to canvas via foreignObject is hard; instead inspect CSS
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    const htmlBg = getComputedStyle(document.documentElement).backgroundColor;
    const stage = document.getElementById("stage");
    const stageBg = stage ? getComputedStyle(stage).backgroundColor : null;
    return { bodyBg, htmlBg, stageBg };
  });

  // Parse PNG alpha with tiny manual reader
  const buf = readFileSync(path);
  // Find IHDR and sample via playwright sharp-less approach: use page to decode
  const alphaSample = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0);
    const center = ctx.getImageData(960, 540, 1, 1).data;
    const identity = ctx.getImageData(100, 70, 1, 1).data;
    return {
      centerRGBA: [...center],
      identityRGBA: [...identity],
      // Note: canvas may premultiply; check alpha channel specifically
      centerAlpha: center[3],
      identityAlpha: identity[3],
    };
  }, buf.toString("base64"));

  writeFileSync(
    "/cursor/stores/self/internal/transparency-check.json",
    JSON.stringify({ check, alphaSample, path }, null, 2),
  );
  console.log({ check, alphaSample });

  // Also write magenta-composite proof using CSS backdrop on same page
  await page.evaluate(() => {
    const bg = document.createElement("div");
    bg.id = "proof-bg";
    bg.style.cssText =
      "position:fixed;inset:0;background:#ff2db3;z-index:-1;pointer-events:none";
    document.body.appendChild(bg);
    document.body.style.background = "transparent";
  });
  await page.screenshot({
    path: "/cursor/stores/self/media/gameplay.png",
    omitBackground: false,
  });
  console.log("wrote magenta-backed gameplay.png");
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
