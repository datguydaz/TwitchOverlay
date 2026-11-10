import { chromium } from "playwright";
import { writeFileSync, existsSync } from "node:fs";

const BASE = "http://127.0.0.1:8787";
const MEDIA = "/cursor/stores/self/media";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  await page.setContent(`<!doctype html>
<html><body style="margin:0;background:#ff2db3;">
<iframe src="${BASE}/gameplay.html" style="border:0;width:1920px;height:1080px;background:transparent;"></iframe>
</body></html>`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${MEDIA}/gameplay.png` });

  // Sample center pixel should be magenta if transparent; sample near identity should not
  const samples = await page.evaluate(() => {
    // Can't read iframe cross-origin pixels easily same-origin actually ok on 127.0.0.1
    return {
      bodyBg: document.body.style.background,
      iframePresent: !!document.querySelector("iframe"),
    };
  });

  // Pixel check via screenshot buffer
  const buf = await page.screenshot();
  // PNG decode via canvas in page
  const pixelCheck = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const center = ctx.getImageData(960, 540, 1, 1).data;
    const nearIdentity = ctx.getImageData(120, 80, 1, 1).data;
    return {
      center: [...center],
      nearIdentity: [...nearIdentity],
    };
  }, buf.toString("base64"));

  writeFileSync(
    "/cursor/stores/self/internal/transparency-check.json",
    JSON.stringify({ samples, pixelCheck, note: "center should be magenta-ish when overlay transparent" }, null, 2),
  );
  console.log(pixelCheck);
  console.log("gameplay.png", existsSync(`${MEDIA}/gameplay.png`));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
