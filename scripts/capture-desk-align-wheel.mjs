import { chromium } from "playwright";
import { resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";

const ts = process.env.PROOF_TS || String(Date.now());
const mediaStore = process.env.MEDIA_STORE || "_proofs";
mkdirSync(mediaStore, { recursive: true });
mkdirSync("_proofs", { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 })
).newPage();
await page.goto("http://127.0.0.1:8787/avatar.html", { waitUntil: "networkidle" });
await page.evaluate(() => {
  document.body.style.background = "radial-gradient(circle at 40% 30%, #2a2a2a, #0a0a0a 72%)";
});
await page.waitForTimeout(400);

const meta = await page.evaluate(() => {
  const kb = document.querySelector("#prop-keyboard");
  const shell = kb?.querySelector("path");
  const stroke = shell?.getAttribute("stroke-width");
  const d = shell?.getAttribute("d") || "";
  const pts = [...d.matchAll(/([ML])\s*([\d.]+)\s+([\d.]+)/g)].map((m) => ({
    x: +m[2],
    y: +m[3],
  }));
  const top = pts.filter((p) => p.y <= 267);
  const bot = pts.filter((p) => p.y >= 293);
  const topW = top.length >= 2 ? Math.abs(top[1].x - top[0].x) : 0;
  const botW = bot.length >= 2 ? Math.abs(bot[1].x - bot[0].x) : 0;
  const left = document.querySelector("#sleeve-stripes-left");
  const leftT = [...(left?.querySelectorAll("path") || [])].map((p) => p.getAttribute("transform"));
  const rightT = [...(document.querySelectorAll("#sleeve-stripes-right path") || [])].map((p) =>
    p.getAttribute("transform"),
  );
  const labels = [...document.querySelectorAll(".kb-label")].map((t) => t.textContent);
  return {
    kbIsPathTrapezoid: !!shell && shell.tagName.toLowerCase() === "path",
    kbStroke: stroke,
    thinOutline: Number(stroke) <= 0.85,
    deskPlaneTaper: topW > botW && topW > 0,
    topW,
    botW,
    hasMousepad: !!document.querySelector("#prop-mousepad"),
    hasLmb: !!document.querySelector("#mouse-lmb"),
    hasRmb: !!document.querySelector("#mouse-rmb"),
    hasWheel: !!document.querySelector("#mouse-wheel"),
    noKbMatrix: !(kb?.getAttribute("transform") || "").includes("matrix"),
    stripeLeft: leftT,
    stripeRight: rightT,
    stripesLoved:
      JSON.stringify(leftT) ===
        JSON.stringify(["translate(3 0)", "translate(8 0)", "translate(13 0)"]) &&
      JSON.stringify(rightT) ===
        JSON.stringify(["translate(-3 0)", "translate(-8 0)", "translate(-13 0)"]),
    stripeCount: leftT.length === 3 && rightT.length === 3,
    hasNordic: labels.includes("Å") && labels.includes("Ö") && labels.includes("Ä"),
    wornKeys: document.querySelectorAll(".kb-label.wear-a, .kb-label.wear-b").length > 0,
    hasDeskWear: !!document.querySelector("#desk-wear"),
    hasHelmWear: !!document.querySelector("#helm-wear"),
  };
});
console.log("meta", JSON.stringify(meta, null, 2));

const box = await page.locator(".avatar-root").boundingBox();
const shot = async (name, clip) => {
  const file = `avatar-proof-${ts}-${name}.png`;
  await page.screenshot({ path: resolve(mediaStore, file), clip, type: "png" });
  await page.screenshot({ path: resolve("_proofs", file), clip, type: "png" });
  console.log("wrote", resolve(mediaStore, file));
  return file;
};

await page.evaluate(() => {
  const r = document.querySelector(".avatar-root");
  if (!r) return;
  r.dataset.source = "demo";
  r.dataset.active = "1";
  delete r.dataset.wheel;
});
await page.waitForTimeout(80);

const files = [];
files.push(
  await shot("desk-align-full", {
    x: box.x,
    y: box.y + box.height * 0.08,
    width: box.width,
    height: box.height * 0.88,
  }),
);
files.push(
  await shot("desk-plane-kb-mousepad", {
    x: box.x + box.width * 0.02,
    y: box.y + box.height * 0.48,
    width: box.width * 0.96,
    height: box.height * 0.46,
  }),
);
files.push(
  await shot("sleeve-stripes-loved", {
    x: box.x + box.width * 0.08,
    y: box.y + box.height * 0.26,
    width: box.width * 0.84,
    height: box.height * 0.4,
  }),
);

await page.evaluate(() => {
  const r = document.querySelector(".avatar-root");
  if (!r) return;
  r.dataset.wheel = "down";
});
await page.waitForTimeout(60);
files.push(
  await shot("wheel-amber-flash", {
    x: box.x + box.width * 0.48,
    y: box.y + box.height * 0.5,
    width: box.width * 0.48,
    height: box.height * 0.42,
  }),
);

const wheelCss = await page.evaluate(() => {
  const el = document.querySelector("#mouse-wheel ellipse");
  if (!el) return null;
  const s = getComputedStyle(el);
  return { fill: s.fill, anim: getComputedStyle(document.querySelector("#mouse-wheel")).animationName };
});
console.log("wheelCss", wheelCss);

await browser.close();

const ok =
  meta.kbIsPathTrapezoid &&
  meta.thinOutline &&
  meta.deskPlaneTaper &&
  meta.hasMousepad &&
  meta.stripesLoved &&
  meta.stripeCount &&
  meta.hasNordic &&
  meta.hasLmb &&
  meta.hasRmb &&
  meta.hasWheel &&
  meta.noKbMatrix &&
  wheelCss?.fill?.includes("199") || wheelCss?.fill?.includes("c792") || (wheelCss?.fill || "").includes("rgb(199");

const note = {
  ts,
  ok,
  meta,
  wheelCss,
  files,
  summary:
    "Desk-plane trapezoid KB+mouse, black mousepad, thin KB border 0.7, loved sleeve stripe transforms locked, wheel amber flash (no spin).",
};
writeFileSync(resolve(mediaStore, `avatar-proof-${ts}-desk-align-note.json`), JSON.stringify(note, null, 2));
writeFileSync(resolve("_proofs", `avatar-proof-${ts}-desk-align-note.json`), JSON.stringify(note, null, 2));

const pass =
  meta.kbIsPathTrapezoid &&
  meta.thinOutline &&
  meta.deskPlaneTaper &&
  meta.hasMousepad &&
  meta.stripesLoved &&
  meta.hasNordic &&
  (wheelCss?.anim === "none" || !wheelCss?.anim || wheelCss?.anim === "");

console.log(pass ? "PROOF_OK" : "PROOF_FAIL", JSON.stringify({
  pass,
  thin: meta.thinOutline,
  taper: meta.deskPlaneTaper,
  pad: meta.hasMousepad,
  stripes: meta.stripesLoved,
  wheelAnim: wheelCss?.anim,
  wheelFill: wheelCss?.fill,
}));
process.exit(pass ? 0 : 1);
