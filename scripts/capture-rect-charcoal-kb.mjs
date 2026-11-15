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
  const shell = kb?.querySelector(":scope > rect");
  const paths = [...(kb?.querySelectorAll(":scope > path") || [])];
  const labels = [...document.querySelectorAll(".kb-label")].map((t) => t.textContent);
  const labelFill = getComputedStyle(document.querySelector(".kb-label.wear-a") || document.querySelector(".kb-label")).fill;
  const stroke = shell?.getAttribute("stroke") || "";
  const leftT = [...document.querySelectorAll("#sleeve-stripes-left path")].map((p) => p.getAttribute("transform"));
  return {
    kbIsRect: shell?.tagName.toLowerCase() === "rect",
    noTrapezoidPathShell: paths.length === 0,
    thinBorder: Number(shell?.getAttribute("stroke-width") || 99) <= 0.7,
    stroke,
    noBeigeStroke: !/#c4b59a/i.test(stroke) && !stroke.toLowerCase().includes("beige"),
    hasNordic: labels.includes("Å") && labels.includes("Ö") && labels.includes("Ä"),
    hasMousepad: !!document.querySelector("#prop-mousepad"),
    mousepadIsRect: document.querySelector("#prop-mousepad rect") != null,
    hasGrain: !!document.querySelector("#desk-grain"),
    hasDeskWear: !!document.querySelector("#desk-wear"),
    hasWheel: !!document.querySelector("#mouse-wheel"),
    stripesLoved:
      JSON.stringify(leftT) === JSON.stringify(["translate(3 0)", "translate(8 0)", "translate(13 0)"]),
    labelFill,
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
await page.waitForTimeout(80);

const files = [];
files.push(
  await shot("rect-charcoal-full", {
    x: box.x,
    y: box.y + box.height * 0.08,
    width: box.width,
    height: box.height * 0.88,
  }),
);
files.push(
  await shot("rect-charcoal-kb-mouse-table", {
    x: box.x + box.width * 0.02,
    y: box.y + box.height * 0.48,
    width: box.width * 0.96,
    height: box.height * 0.46,
  }),
);

await page.evaluate(() => {
  const r = document.querySelector(".avatar-root");
  if (r) r.dataset.wheel = "down";
});
await page.waitForTimeout(50);
files.push(
  await shot("wheel-amber-charcoal-mouse", {
    x: box.x + box.width * 0.5,
    y: box.y + box.height * 0.5,
    width: box.width * 0.46,
    height: box.height * 0.4,
  }),
);

await browser.close();

const pass =
  meta.kbIsRect &&
  meta.noTrapezoidPathShell &&
  meta.thinBorder &&
  meta.noBeigeStroke &&
  meta.hasNordic &&
  meta.hasMousepad &&
  meta.hasGrain &&
  meta.stripesLoved;

const note = { ts, pass, meta, files };
writeFileSync(resolve(mediaStore, `avatar-proof-${ts}-rect-charcoal-note.json`), JSON.stringify(note, null, 2));
writeFileSync(resolve("_proofs", `avatar-proof-${ts}-rect-charcoal-note.json`), JSON.stringify(note, null, 2));
console.log(pass ? "PROOF_OK" : "PROOF_FAIL", JSON.stringify({ pass, kbIsRect: meta.kbIsRect, stroke: meta.stroke, grain: meta.hasGrain }));
process.exit(pass ? 0 : 1);
