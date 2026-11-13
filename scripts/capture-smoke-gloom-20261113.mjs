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
const context = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
});
const page = await context.newPage();

// Seed last-known social names the same way live Streamlabs will persist them
// (do NOT inject DOM text after load — that hid empty-settings bugs in older proofs).
await page.addInitScript(() => {
  try {
    localStorage.setItem("pz.uw.smoke.lastFollower", "RYSEABOVEIT");
    localStorage.setItem("pz.uw.smoke.lastSubscriber", "ACTYR:[6]");
  } catch {
    /* ignore */
  }
});

// Allow Google Fonts so proof matches Streamlabs Oswald (previous proofs aborted fonts).
const url = `http://127.0.0.1:8787/ultrawide-smoke.html?gloom=${Date.now()}`;
await page.goto(url, { waitUntil: "commit", timeout: 20000 });
await page.waitForFunction(() => !!document.getElementById("uw-stage"), null, {
  timeout: 10000,
});
await page.waitForTimeout(900);
// Wait for procedural ruin canvases (steel / wisps / blood / torn edge)
await page.waitForFunction(
  () =>
    document.querySelectorAll("canvas.smk-steel-canvas").length >= 2 &&
    document.querySelectorAll("canvas.smk-wisp-canvas").length >= 2 &&
    document.querySelectorAll("canvas.smk-blood-canvas").length >= 4,
  null,
  { timeout: 15000 },
);
// Wait for Oswald / Share Tech Mono so glyph metrics match Streamlabs
try {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });
  await page.waitForTimeout(400);
} catch {
  await page.waitForTimeout(600);
}

const dump = await page.evaluate((bar) => {
  const s = document.getElementById("uw-stage");
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
  const folEl = document.getElementById("uw-follower");
  const subEl = document.getElementById("uw-subscriber");
  const folName = document.getElementById("uw-follower-name");
  const subName = document.getElementById("uw-subscriber-name");
  const folBox = folEl?.getBoundingClientRect();
  const subBox = subEl?.getBoundingClientRect();
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
  const crates = document.querySelectorAll(".smk-crate").length;
  const radioScreens = document.querySelectorAll(".smk-radio-screen").length;
  const fxStatic = document.querySelectorAll(".smk-fx-static").length;
  const fxScan = document.querySelectorAll(".smk-fx-scan").length;
  const fxDrop = document.querySelectorAll(".smk-fx-dropout").length;
  const edgeStacks = document.querySelectorAll(".smk-edge-stack").length;
  const steel = document.querySelectorAll(".smk-steel").length;
  const hud = document.querySelectorAll(".smk-hud").length;
  let lastFol = "";
  let lastSub = "";
  try {
    lastFol = localStorage.getItem("pz.uw.smoke.lastFollower") || "";
    lastSub = localStorage.getItem("pz.uw.smoke.lastSubscriber") || "";
  } catch {
    /* ignore */
  }
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
    nameSize: csFace?.fontSize,
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
    crates,
    radioScreens,
    fxStatic,
    fxScan,
    fxDrop,
    edgeStacks,
    steel,
    hud,
    hasStandby: /STANDBY/i.test(`${folName?.textContent || ""}${subName?.textContent || ""}`),
    forbidden,
    labels: [...document.querySelectorAll(".uw-glass-label")].map((el) =>
      (el.textContent || "").replace(/\s+/g, " ").trim(),
    ),
    follower: folName?.textContent || "",
    subscriber: subName?.textContent || "",
    lastFol,
    lastSub,
    // Plates must sit fully inside the top bar (above torn baseline)
    folBottomGap: folBox && top ? Math.round(top.bottom - folBox.bottom) : null,
    subBottomGap: subBox && top ? Math.round(top.bottom - subBox.bottom) : null,
    followerLeft: Math.round(folBox?.left || 0),
    subRight: Math.round(3440 - (subBox?.right || 0)),
    opColor: op ? getComputedStyle(op).color : null,
    opFill: op ? getComputedStyle(op).webkitTextFillColor : null,
    nameFont: csFace?.fontFamily,
    socialFont: getComputedStyle(folName || document.body).fontFamily,
    socialSize: getComputedStyle(folName || document.body).fontSize,
    fontsStatus: document.fonts?.status || "unknown",
  };
}, BAR);
console.log(JSON.stringify(dump, null, 2));

if (dump.path !== "/ultrawide-smoke.html") process.exit(2);
if (!dump.hasSmokeCss || dump.variant !== "smoke-flare") process.exit(3);
if (dump.stageW !== W || dump.stageH !== H) process.exit(4);
if (dump.stageTransform && dump.stageTransform !== "none") process.exit(5);
if (dump.topH !== BAR || dump.botH !== BAR) process.exit(6);
if (dump.topBottom !== BAR || dump.botTop !== H - BAR) process.exit(7);
if (dump.gapPx == null || dump.gapPx < 4) process.exit(8);
if (dump.forbidden.some((f) => f.visible)) {
  console.error("forbidden bright FX still visible", dump.forbidden);
  process.exit(9);
}
if (dump.opRules < 2 || dump.bloodCorners < 4) process.exit(10);
if (
  dump.plates < 2 ||
  dump.crates < 2 ||
  dump.radioScreens < 2 ||
  dump.edgeStacks < 2 ||
  dump.steel < 2 ||
  dump.hud < 2
) {
  console.error("missing ruin layers", {
    plates: dump.plates,
    crates: dump.crates,
    radioScreens: dump.radioScreens,
    edgeStacks: dump.edgeStacks,
    steel: dump.steel,
    hud: dump.hud,
  });
  process.exit(11);
}
if (dump.fxStatic < 2 || dump.fxScan < 2 || dump.fxDrop < 2) {
  console.error("missing bar FX layers", {
    fxStatic: dump.fxStatic,
    fxScan: dump.fxScan,
    fxDrop: dump.fxDrop,
  });
  process.exit(20);
}
if (dump.hasStandby) {
  console.error("STANDBY must not appear");
  process.exit(21);
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
// Names must render via last-known fallback (not empty plates)
if (!dump.follower || !dump.subscriber) {
  console.error("social names empty — fallback failed", dump.follower, dump.subscriber);
  process.exit(17);
}
if (dump.follower !== "RYSEABOVEIT" || dump.subscriber !== "ACTYR:[6]") {
  console.error("expected seeded last-known names", dump.follower, dump.subscriber);
  process.exit(18);
}
// Plates fully inside bar (positive gap above torn edge)
if (
  dump.folBottomGap == null ||
  dump.subBottomGap == null ||
  dump.folBottomGap < 20 ||
  dump.subBottomGap < 20
) {
  console.error("plates hang past bar edge", dump.folBottomGap, dump.subBottomGap);
  process.exit(19);
}

await page.waitForTimeout(300);
// Freeze a subtle FX state for proof readability (live FX are timed bursts)
await page.evaluate(() => {
  document.querySelectorAll(".smk-ruin-bar").forEach((el) => {
    el.classList.add("smk-fx-on-static");
  });
  document.querySelector("#uw-top")?.classList.add("smk-fx-on-dropout");
  document.querySelector(".smk-nameplate")?.classList.add("smk-fx-on-tear");
  document.querySelector("#uw-bottom")?.classList.add("smk-fx-on-sparks");
  const fol = document.getElementById("uw-follower");
  if (fol) {
    fol.dataset.socialFx = "new";
    fol.querySelector(".smk-new")?.classList.add("on");
  }
});
await page.waitForTimeout(100);

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
      proofNotes:
        "3440×1440 dpr=1; Google Fonts allowed; names via localStorage last-known; ammo-crate radio plates; FX classes briefly forced for proof (live = timed).",
    },
    null,
    2,
  ),
);

console.log("wrote", fullPath);
console.log("wrote", topPath);
console.log("wrote", botPath);
await browser.close();
