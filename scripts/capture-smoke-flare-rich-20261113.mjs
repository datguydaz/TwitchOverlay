import { chromium } from "playwright";
import { resolve } from "path";
import { mkdirSync, copyFileSync, writeFileSync } from "fs";

const media = process.argv[2];
const also = process.argv[3];
if (!media) {
  console.error("usage: capture-smoke-flare-rich-20261113.mjs <media> [also]");
  process.exit(1);
}
mkdirSync(media, { recursive: true });
if (also) mkdirSync(also, { recursive: true });

const W = 3440;
const H = 1440;

const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
  })
).newPage();

await page.route("**/*", (route) => {
  const u = route.request().url();
  if (/fonts\.googleapis|fonts\.gstatic|fonts\.google/.test(u)) return route.abort();
  return route.continue();
});

const url = `http://127.0.0.1:8787/ultrawide-smoke.html?rich=${Date.now()}`;
await page.goto(url, { waitUntil: "commit", timeout: 20000 });
await page.waitForFunction(() => !!document.getElementById("uw-stage"), null, {
  timeout: 10000,
});
await page.waitForTimeout(700);

const dump = await page.evaluate(() => {
  const s = document.getElementById("uw-stage");
  document.getElementById("uw-follower-name").textContent = "RYSEABOVEIT";
  document.getElementById("uw-subscriber-name").textContent = "ACTYR:[6]";
  const face = document.querySelector(".smk-name-face");
  const op = document.querySelector(".smk-op .uw-text-face");
  const csFace = face ? getComputedStyle(face) : null;
  const csBody = getComputedStyle(document.body);
  const csHtml = getComputedStyle(document.documentElement);
  const csStage = s ? getComputedStyle(s) : null;
  const faceBox = face?.getBoundingClientRect();
  const opBox = op?.getBoundingClientRect();
  const sheets = [...document.styleSheets]
    .map((ss) => (ss.href || "").split("/").pop())
    .filter(Boolean);
  return {
    path: location.pathname,
    variant: s?.dataset.variant,
    textFx: s?.dataset.textFx,
    sheets,
    hasSmokeCss: sheets.some((x) => /ultrawide-smoke/i.test(x)),
    hasSlash: !!document.querySelector(".smk-name-slash"),
    hasChevron: !!document.querySelector(".smk-chevron"),
    hasBlades: document.querySelectorAll(".smk-blade").length,
    hasTicks: document.querySelectorAll(".smk-label-tick").length,
    hasBlooms: document.querySelectorAll(".smk-flare-bloom").length,
    hasStarfield: !!document.querySelector(".smk-starfield"),
    hasCracks: document.querySelectorAll(".smk-corner-crack").length,
    gapPx: faceBox && opBox ? opBox.top - faceBox.bottom : null,
    opText: op?.textContent || "",
    nameShadow: csFace?.textShadow,
    nameFilter: csFace?.filter,
    bodyBg: csBody.backgroundColor,
    htmlOverflow: csHtml.overflow,
    bodyOverflow: csBody.overflow,
    bodyW: Math.round(document.body.getBoundingClientRect().width),
    bodyH: Math.round(document.body.getBoundingClientRect().height),
    stageW: Math.round(s?.getBoundingClientRect().width || 0),
    stageH: Math.round(s?.getBoundingClientRect().height || 0),
    stageTransform: csStage?.transform,
    scrollW: document.documentElement.scrollWidth,
    scrollH: document.documentElement.scrollHeight,
    labels: [...document.querySelectorAll(".uw-glass-label")].map((el) =>
      (el.textContent || "").replace(/\s+/g, " ").trim(),
    ),
  };
});
console.log(JSON.stringify(dump, null, 2));

if (dump.path !== "/ultrawide-smoke.html") process.exit(2);
if (!dump.hasSmokeCss || dump.variant !== "smoke-flare") process.exit(3);
if (!dump.hasSlash || !dump.hasChevron || dump.hasBlades < 2) process.exit(4);
if (dump.gapPx == null || dump.gapPx < 10) process.exit(5);
if (dump.stageW !== W || dump.stageH !== H) process.exit(6);
if (dump.stageTransform && dump.stageTransform !== "none") process.exit(7);
if (dump.scrollW > W + 2 || dump.scrollH > H + 2) process.exit(8);
if (/amber|200,\s*136|255,\s*200|255,\s*230/i.test(dump.nameShadow || "")) process.exit(9);

await page.waitForTimeout(400);
const fullPath = resolve(media, "smoke-flare-rich-20261113.png");
const topPath = resolve(media, "smoke-flare-rich-20261113-top.png");

// Full 3440×1440 transparent-capable capture of the smoke page
await page.screenshot({ path: fullPath, type: "png", omitBackground: true });

const top = await page.locator("#uw-top").boundingBox();
await page.screenshot({
  path: topPath,
  type: "png",
  omitBackground: true,
  clip: {
    x: 0,
    y: Math.max(0, top.y - 4),
    width: W,
    height: Math.min(H, top.height + 40),
  },
});

console.log("wrote", fullPath);
console.log("wrote", topPath);
console.log(
  JSON.stringify(
    {
      browserSourceUrl: "http://127.0.0.1:8787/ultrawide-smoke.html",
      width: W,
      height: H,
      transparent: true,
    },
    null,
    2,
  ),
);

if (also) {
  copyFileSync(fullPath, resolve(also, "smoke-flare-rich-20261113.png"));
  copyFileSync(topPath, resolve(also, "smoke-flare-rich-20261113-top.png"));
}

await browser.close();
