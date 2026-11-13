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
  const torso = document.querySelector("#layer-torso");
  const head = document.querySelector("#layer-head");
  const torsoSit = document.querySelector("#torso-sit");
  const headSit = document.querySelector("#head-sit");
  const belt = document.querySelector("#torso-sit > rect:last-of-type");
  const desk = document.querySelector("#desk path");
  const killa = document.querySelector("#chest-killa-main");
  const kb = document.querySelector("#prop-keyboard > rect");
  const box = (el) => {
    if (!el?.getBBox) return null;
    const b = el.getBBox();
    return { y: +b.y.toFixed(1), h: +b.height.toFixed(1), bottom: +(b.y + b.height).toFixed(1) };
  };
  const sitOk = (el) => /translate\(0 (3[0-9]|4[0-9])\)/.test(el?.getAttribute("transform") || "");
  const headCs = head ? getComputedStyle(head) : null;
  return {
    torsoSitTx: torsoSit?.getAttribute("transform") || "",
    headSitTx: headSit?.getAttribute("transform") || "",
    bodyCloser: sitOk(torsoSit),
    headCloser: sitOk(headSit),
    hasKilla: killa?.textContent === "KILLA",
    killaY: killa?.getAttribute("y"),
    kbIsRect: kb?.tagName.toLowerCase() === "rect",
    kbStroke: kb?.getAttribute("stroke"),
    hasMousepad: !!document.querySelector("#prop-mousepad"),
    headAnim: headCs?.animationName || "",
    headTiming: headCs?.animationTimingFunction || "",
    torsoAnim: torso ? getComputedStyle(torso).animationName : "",
    beltBox: box(belt),
    deskD: desk?.getAttribute("d")?.slice(0, 40),
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
});
await page.waitForTimeout(100);

const files = [];
files.push(
  await shot("body-closer-full", {
    x: box.x,
    y: box.y + box.height * 0.05,
    width: box.width,
    height: box.height * 0.92,
  }),
);
files.push(
  await shot("body-desk-gap-killa", {
    x: box.x + box.width * 0.12,
    y: box.y + box.height * 0.22,
    width: box.width * 0.76,
    height: box.height * 0.55,
  }),
);
files.push(
  await shot("rect-kb-close-body", {
    x: box.x + box.width * 0.02,
    y: box.y + box.height * 0.45,
    width: box.width * 0.96,
    height: box.height * 0.48,
  }),
);

await browser.close();

const headLinear = String(meta.headTiming || "").includes("linear");
const pass =
  meta.bodyCloser &&
  meta.headCloser &&
  meta.hasKilla &&
  meta.kbIsRect &&
  meta.kbStroke === "#4a4a4a" &&
  meta.hasMousepad &&
  meta.headAnim === "head-idle" &&
  headLinear;

const note = { ts, pass, meta, files, headLinear };
writeFileSync(resolve(mediaStore, `avatar-proof-${ts}-body-desk-note.json`), JSON.stringify(note, null, 2));
writeFileSync(resolve("_proofs", `avatar-proof-${ts}-body-desk-note.json`), JSON.stringify(note, null, 2));
console.log(
  pass ? "PROOF_OK" : "PROOF_FAIL",
  JSON.stringify({
    pass,
    bodyCloser: meta.bodyCloser,
    killa: meta.hasKilla,
    headLinear,
    headAnim: meta.headAnim,
  }),
);
process.exit(pass ? 0 : 1);
