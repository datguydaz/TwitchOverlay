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
await page.waitForTimeout(350);

const meta = await page.evaluate(() => {
  const op = document.querySelector("#operator");
  const kids = op ? [...op.children].map((el) => el.id || el.tagName) : [];
  const deskIdx = kids.indexOf("desk");
  const torsoIdx = kids.indexOf("layer-torso");
  const headIdx = kids.indexOf("layer-head");
  const kbIdx = kids.indexOf("prop-keyboard");
  const leftTx = [...document.querySelectorAll("#sleeve-stripes-left path")].map(
    (p) => p.getAttribute("transform") || "",
  );
  const rightTx = [...document.querySelectorAll("#sleeve-stripes-right path")].map(
    (p) => p.getAttribute("transform") || "",
  );
  // Symmetric ±5 around mid-sleeve centerline (not jammed to inner edge).
  const centered =
    leftTx.join("|") === "translate(-5 0)|translate(0 0)|translate(5 0)" &&
    rightTx.join("|") === "translate(-5 0)|translate(0 0)|translate(5 0)";
  const stanags = document.querySelectorAll("#chest-rig .stanag-pouch, #chest-rig [id^=stanag-]").length;
  const torsoSit = document.querySelector("#torso-sit")?.getAttribute("transform") || "";
  const headSit = document.querySelector("#head-sit")?.getAttribute("transform") || "";
  const killa = document.querySelector("#chest-killa-main");
  const kb = document.querySelector("#prop-keyboard > rect");
  const head = document.querySelector("#layer-head");
  const headCs = head ? getComputedStyle(head) : null;
  return {
    kids,
    deskAfterBody: deskIdx > torsoIdx && deskIdx > headIdx && deskIdx < kbIdx,
    centeredStripes: centered,
    leftTx,
    rightTx,
    stanagCount: stanags,
    torsoSit,
    headSit,
    bodyCloser: /translate\(0 3[0-9]\)/.test(torsoSit),
    hasKilla: killa?.textContent === "KILLA",
    killaY: killa?.getAttribute("y"),
    kbIsRect: kb?.tagName.toLowerCase() === "rect",
    kbStroke: kb?.getAttribute("stroke"),
    headAnim: headCs?.animationName || "",
    headTiming: headCs?.animationTimingFunction || "",
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

const files = [];
files.push(
  await shot("desk-sit-full", {
    x: box.x,
    y: box.y + box.height * 0.04,
    width: box.width,
    height: box.height * 0.94,
  }),
);
files.push(
  await shot("stripes-stanag-chest", {
    x: box.x + box.width * 0.1,
    y: box.y + box.height * 0.18,
    width: box.width * 0.8,
    height: box.height * 0.55,
  }),
);
files.push(
  await shot("desk-lip-no-clip", {
    x: box.x + box.width * 0.05,
    y: box.y + box.height * 0.42,
    width: box.width * 0.9,
    height: box.height * 0.48,
  }),
);

await browser.close();

const pass =
  meta.deskAfterBody &&
  meta.centeredStripes &&
  meta.stanagCount === 4 &&
  meta.bodyCloser &&
  meta.hasKilla &&
  meta.kbIsRect &&
  meta.kbStroke === "#4a4a4a" &&
  meta.headAnim === "head-idle" &&
  String(meta.headTiming).includes("linear");

const note = { ts, pass, meta, files };
writeFileSync(resolve(mediaStore, `avatar-proof-${ts}-desk-stripes-stanag-note.json`), JSON.stringify(note, null, 2));
writeFileSync(resolve("_proofs", `avatar-proof-${ts}-desk-stripes-stanag-note.json`), JSON.stringify(note, null, 2));
console.log(
  pass ? "PROOF_OK" : "PROOF_FAIL",
  JSON.stringify({
    pass,
    deskAfterBody: meta.deskAfterBody,
    centeredStripes: meta.centeredStripes,
    stanagCount: meta.stanagCount,
    killa: meta.hasKilla,
  }),
);
process.exit(pass ? 0 : 1);
