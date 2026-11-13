import { chromium } from "playwright";
import { resolve } from "path";
import { mkdirSync, copyFileSync, readFileSync, writeFileSync } from "fs";
import { PNG } from "pngjs";

const media = process.argv[2];
const also = process.argv[3];
if (!media) {
  console.error("usage: capture-smoke-gloom-20261113.mjs <media> [also]");
  process.exit(1);
}
mkdirSync(media, { recursive: true });
if (also) mkdirSync(also, { recursive: true });

const W = 3440;
const H = 1440;
const BAR = 248;

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

const url = `http://127.0.0.1:8787/ultrawide-smoke.html?gloom=${Date.now()}`;
await page.goto(url, { waitUntil: "commit", timeout: 20000 });
await page.waitForFunction(() => !!document.getElementById("uw-stage"), null, {
  timeout: 10000,
});
await page.waitForTimeout(900);

const dump = await page.evaluate((bar) => {
  const s = document.getElementById("uw-stage");
  document.getElementById("uw-follower-name").textContent = "RYSEABOVEIT";
  document.getElementById("uw-subscriber-name").textContent = "ACTYR:[6]";
  const face = document.querySelector(".smk-name-face");
  const op = document.querySelector(".smk-op .uw-text-face");
  const csFace = face ? getComputedStyle(face) : null;
  const csBody = getComputedStyle(document.body);
  const csStage = s ? getComputedStyle(s) : null;
  const voidEl = document.querySelector(".uw-smoke-void");
  const csVoid = voidEl ? getComputedStyle(voidEl) : null;
  const faceBox = face?.getBoundingClientRect();
  const opBox = op?.getBoundingClientRect();
  const top = document.getElementById("uw-top")?.getBoundingClientRect();
  const bot = document.getElementById("uw-bottom")?.getBoundingClientRect();
  const sheets = [...document.styleSheets]
    .map((ss) => (ss.href || "").split("/").pop())
    .filter(Boolean);
  const forbidden = [
    ".uw-lens-flare",
    ".smk-flare-bloom",
    ".smk-starfield",
    ".smk-blade",
    ".smk-name-slash",
  ].map((sel) => ({
    sel,
    n: document.querySelectorAll(sel).length,
    visible: [...document.querySelectorAll(sel)].some((el) => {
      const cs = getComputedStyle(el);
      return cs.display !== "none" && cs.visibility !== "hidden" && Number(cs.opacity) > 0;
    }),
  }));
  const opRules = document.querySelectorAll(".smk-op-rule").length;
  const blood = document.querySelectorAll(".smk-corner-blood").length;
  const plates = document.querySelectorAll(".smk-plate").length;
  const edgeStacks = document.querySelectorAll(".smk-edge-stack").length;
  const steel = document.querySelectorAll(".smk-steel").length;
  const hud = document.querySelectorAll(".smk-hud").length;
  return {
    path: location.pathname,
    variant: s?.dataset.variant,
    textFx: s?.dataset.textFx,
    sheets,
    hasSmokeCss: sheets.some((x) => /ultrawide-smoke/i.test(x)),
    gapPx: faceBox && opBox ? opBox.top - faceBox.bottom : null,
    opText: op?.textContent || "",
    nameFill: csFace?.webkitTextFillColor || csFace?.color,
    nameFilter: csFace?.filter,
    bodyBg: csBody.backgroundColor,
    stageBg: csStage?.backgroundColor,
    voidBg: csVoid?.backgroundColor,
    bodyW: Math.round(document.body.getBoundingClientRect().width),
    bodyH: Math.round(document.body.getBoundingClientRect().height),
    stageW: Math.round(s?.getBoundingClientRect().width || 0),
    stageH: Math.round(s?.getBoundingClientRect().height || 0),
    stageTransform: csStage?.transform,
    topH: Math.round(top?.height || 0),
    botH: Math.round(bot?.height || 0),
    topBottom: Math.round(top?.bottom || 0),
    botTop: Math.round(bot?.top || 0),
    barExpected: bar,
    opRules,
    bloodCorners: blood,
    plates,
    edgeStacks,
    steel,
    hud,
    forbidden,
    labels: [...document.querySelectorAll(".uw-glass-label")].map((el) =>
      (el.textContent || "").replace(/\s+/g, " ").trim(),
    ),
    follower: document.getElementById("uw-follower-name")?.textContent,
    subscriber: document.getElementById("uw-subscriber-name")?.textContent,
    followerLeft: Math.round(
      document.getElementById("uw-follower")?.getBoundingClientRect().left || 0,
    ),
    subRight: Math.round(
      3440 -
        (document.getElementById("uw-subscriber")?.getBoundingClientRect().right || 0),
    ),
    opColor: op ? getComputedStyle(op).color : null,
    opFill: op ? getComputedStyle(op).webkitTextFillColor : null,
    nameFont: csFace?.fontFamily,
    socialFont: getComputedStyle(document.getElementById("uw-follower-name") || document.body)
      .fontFamily,
    socialSize: getComputedStyle(document.getElementById("uw-follower-name") || document.body)
      .fontSize,
  };
}, BAR);
console.log(JSON.stringify(dump, null, 2));

if (dump.path !== "/ultrawide-smoke.html") process.exit(2);
if (!dump.hasSmokeCss || dump.variant !== "smoke-flare") process.exit(3);
if (dump.stageW !== W || dump.stageH !== H) process.exit(4);
if (dump.stageTransform && dump.stageTransform !== "none") process.exit(5);
if (dump.topH !== BAR || dump.botH !== BAR) process.exit(6);
if (dump.topBottom !== BAR || dump.botTop !== H - BAR) process.exit(7);
if (dump.gapPx == null || dump.gapPx < 8) process.exit(8);
if (dump.forbidden.some((f) => f.visible)) {
  console.error("forbidden bright FX still visible", dump.forbidden);
  process.exit(9);
}
if (dump.opRules < 2 || dump.bloodCorners < 4) process.exit(10);
if (dump.plates < 2 || dump.edgeStacks < 2 || dump.steel < 2 || dump.hud < 2) {
  console.error("missing ruin layers", {
    plates: dump.plates,
    edgeStacks: dump.edgeStacks,
    steel: dump.steel,
    hud: dump.hud,
  });
  process.exit(11);
}
if (/amber|255,\s*200|255,\s*230|ffc|ffe|yellow/i.test(dump.nameFilter || "")) process.exit(12);
if (dump.followerLeft < 200 || dump.subRight < 200) {
  console.error("social not inset enough", dump.followerLeft, dump.subRight);
  process.exit(13);
}
if (!/Oswald/i.test(dump.socialFont || "") || !/Oswald/i.test(dump.nameFont || "")) {
  console.error("expected Oswald condensed family", dump.nameFont, dump.socialFont);
  process.exit(14);
}

await page.waitForTimeout(500);
const fullPath = resolve(media, "smoke-gloom-20261113.png");
const topPath = resolve(media, "smoke-gloom-20261113-top.png");
const botPath = resolve(media, "smoke-gloom-20261113-bottom.png");

await page.screenshot({ path: fullPath, type: "png", omitBackground: true });
const top = await page.locator("#uw-top").boundingBox();
const bot = await page.locator("#uw-bottom").boundingBox();
await page.screenshot({
  path: topPath,
  type: "png",
  omitBackground: true,
  clip: {
    x: 0,
    y: Math.max(0, top.y - 2),
    width: W,
    height: Math.min(H, top.height + 8),
  },
});
await page.screenshot({
  path: botPath,
  type: "png",
  omitBackground: true,
  clip: {
    x: 0,
    y: Math.max(0, bot.y - 4),
    width: W,
    height: Math.min(H - bot.y + 4, bot.height + 8),
  },
});

const png = PNG.sync.read(readFileSync(fullPath));
if (png.width !== W || png.height !== H) {
  console.error("proof size mismatch", png.width, png.height);
  process.exit(15);
}
const samples = [
  [W / 2, BAR + 40],
  [W / 2, H / 2],
  [W / 2, H - BAR - 40],
  [200, H / 2],
  [W - 200, H / 2],
  [W / 4, BAR + 120],
  [W * 0.75, H - BAR - 120],
];
let opaque = 0;
const sampleOut = [];
for (const [x, y] of samples) {
  const xi = Math.round(x);
  const yi = Math.round(y);
  const i = (png.width * yi + xi) << 2;
  const a = png.data[i + 3];
  sampleOut.push({ x: xi, y: yi, r: png.data[i], g: png.data[i + 1], b: png.data[i + 2], a });
  if (a !== 0) opaque++;
}
let stageOpaque = 0;
let stageChecked = 0;
for (let y = BAR + 2; y < H - BAR - 2; y += 24) {
  for (let x = 2; x < W - 2; x += 48) {
    const i = (png.width * y + x) << 2;
    stageChecked++;
    if (png.data[i + 3] !== 0) stageOpaque++;
  }
}
const transparency = {
  samples: sampleOut,
  opaqueSamples: opaque,
  stageChecked,
  stageOpaque,
};
console.log("transparency", JSON.stringify(transparency, null, 2));
if (opaque > 0 || stageOpaque > 0) {
  console.error("STAGE NOT FULLY TRANSPARENT");
  process.exit(16);
}

if (also) {
  copyFileSync(fullPath, resolve(also, "smoke-gloom-20261113.png"));
  copyFileSync(topPath, resolve(also, "smoke-gloom-20261113-top.png"));
  copyFileSync(botPath, resolve(also, "smoke-gloom-20261113-bottom.png"));
}

writeFileSync(
  resolve(media, "smoke-gloom-20261113-meta.json"),
  JSON.stringify(
    {
      dump,
      transparency,
      browserSourceUrl: "http://127.0.0.1:8787/ultrawide-smoke.html",
      width: W,
      height: H,
    },
    null,
    2,
  ),
);

console.log("wrote", fullPath);
console.log("wrote", topPath);
console.log("wrote", botPath);
await browser.close();
