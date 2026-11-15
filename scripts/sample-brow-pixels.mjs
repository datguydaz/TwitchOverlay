import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const path = process.argv[2];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const b64 = readFileSync(path).toString("base64");
await page.setContent(`<img id="i" src="data:image/png;base64,${b64}">`);
await page.waitForSelector("#i");
const samples = await page.evaluate(async () => {
  const img = document.getElementById("i");
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);
  // Sample a horizontal band through middle of image (visor area ~center)
  const y = Math.floor(c.height * 0.48);
  const out = [];
  for (let x = Math.floor(c.width * 0.25); x < Math.floor(c.width * 0.75); x += 8) {
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
    // flag warm/gold-ish pixels (high R relative to B, moderate brightness)
    const warm = r > 120 && r > b + 40 && r > g - 10;
    out.push({ x, r, g, b, warm });
  }
  // also scan a few rows around visor
  let warmCount = 0;
  for (let yy = Math.floor(c.height * 0.42); yy < Math.floor(c.height * 0.55); yy++) {
    for (let x = Math.floor(c.width * 0.3); x < Math.floor(c.width * 0.7); x++) {
      const [r, g, b] = ctx.getImageData(x, yy, 1, 1).data;
      if (r > 130 && r > b + 45 && r >= g - 5 && g < 200) warmCount++;
    }
  }
  return { size: [c.width, c.height], y, warmCount, mid: out.filter((p) => p.warm) };
});
console.log(JSON.stringify(samples, null, 2));
await browser.close();
