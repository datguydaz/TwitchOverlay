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
  const idx = (id) => kids.indexOf(id);
  const orderOk =
    idx("layer-torso") < idx("desk") &&
    idx("layer-head") < idx("desk") &&
    idx("desk") < idx("prop-keyboard") &&
    idx("prop-keyboard") < idx("hand-left") &&
    idx("prop-mouse") < idx("hand-right");

  const leftSit = document.querySelector("#hand-left-sit");
  const rightSit = document.querySelector("#hand-right-sit");
  const noBadHandOffset =
    !(leftSit?.getAttribute("transform") || "").match(/translate\(0 [1-9]/) &&
    !(rightSit?.getAttribute("transform") || "").match(/translate\(0 [1-9]/);

  const leftBox = leftSit?.getBBox?.();
  const rightBox = rightSit?.getBBox?.();
  const kbBox = document.querySelector("#prop-keyboard")?.getBBox?.();
  const mouseBox = document.querySelector("#prop-mouse")?.getBBox?.();
  const deskTop = document.querySelector("#desk-top");
  const apronEl = document.querySelector("#desk-apron");
  const apron = apronEl?.getBBox?.();
  const leftOnKb =
    leftBox &&
    kbBox &&
    leftBox.y < kbBox.y + kbBox.height &&
    leftBox.y + leftBox.height > kbBox.y &&
    leftBox.x + leftBox.width > kbBox.x &&
    leftBox.x < kbBox.x + kbBox.width &&
    (!apron || leftBox.y + leftBox.height <= apron.y + 2);

  const rightOnMouse =
    rightBox &&
    mouseBox &&
    rightBox.y < mouseBox.y + mouseBox.height &&
    rightBox.y + rightBox.height > mouseBox.y &&
    rightBox.x + rightBox.width > mouseBox.x &&
    rightBox.x < mouseBox.x + mouseBox.width &&
    (!apron || rightBox.y + rightBox.height <= apron.y + 2);

  const stanag = [...document.querySelectorAll("#chest-rig [id^=stanag-]")].map((el) =>
    el.getAttribute("transform"),
  );
  const killa = document.querySelector("#chest-killa-main");
  const killaGroup = document.querySelector("#chest-killa");
  const chestRig = document.querySelector("#chest-rig");
  const torsoKids = [...(document.querySelector("#torso-sit")?.children || [])].map(
    (el) => el.id || el.tagName,
  );
  const killaIdx = torsoKids.indexOf("chest-killa");
  const rigIdx = torsoKids.indexOf("chest-rig");
  const kb = document.querySelector("#prop-keyboard > rect");
  const molle = document.querySelector("#molle-plate");
  const deskFill = deskTop?.getAttribute("fill") || "";

  return {
    kids,
    orderOk,
    noBadHandOffset,
    leftOnKb: !!leftOnKb,
    rightOnMouse: !!rightOnMouse,
    leftBox: leftBox
      ? { y: +leftBox.y.toFixed(1), bottom: +(leftBox.y + leftBox.height).toFixed(1) }
      : null,
    rightBox: rightBox
      ? { y: +rightBox.y.toFixed(1), bottom: +(rightBox.y + rightBox.height).toFixed(1) }
      : null,
    hasDeskTop: !!deskTop,
    hasApron: !!apronEl,
    stanag,
    stanagCentered: stanag.join("|") ===
      "translate(134 166)|translate(168 166)|translate(202 166)|translate(236 166)",
    killaUnderPouches: killaIdx >= 0 && rigIdx > killaIdx,
    killaY: killa?.getAttribute("y"),
    killaSize: killa?.getAttribute("font-size"),
    killaTextLength: killa?.getAttribute("textLength"),
    killaWide: Number(killa?.getAttribute("font-size") || 0) >= 14 &&
      Number(killa?.getAttribute("textLength") || 0) >= 140,
    hasKilla: killa?.textContent === "KILLA",
    hasMolle: !!molle,
    hasVestWear: !!document.querySelector("#vest-wear"),
    deskCharcoal: deskFill.includes("deskTopGrad"),
    kbIsRect: kb?.tagName.toLowerCase() === "rect",
    kbStroke: kb?.getAttribute("stroke"),
    hasMousepad: !!document.querySelector("#prop-mousepad"),
    torsoSit: document.querySelector("#torso-sit")?.getAttribute("transform") || "",
    torsoClip: document.querySelector("#torso-sit")?.getAttribute("clip-path") || "",
    headScale: document.querySelector("#head-scale")?.getAttribute("transform") || "",
    headSmaller: /scale\(0\.8[5-9]|0\.9[0-2]\)/.test(
      document.querySelector("#head-scale")?.getAttribute("transform") || "",
    ),
    headScaleVal: (document.querySelector("#head-scale")?.getAttribute("transform") || "").match(
      /scale\(([\d.]+)\)/,
    )?.[1] || "",
    hasDeskRgb: !!document.querySelector("#desk-rgb"),
    skinHands: (() => {
      const p = document.querySelector("#hand-left-sit path");
      const fill = p?.getAttribute("fill") || "";
      return fill === "#c4a07a" || fill.toLowerCase().includes("c4a07a");
    })(),
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
  await shot("full-sit", {
    x: box.x,
    y: box.y + box.height * 0.04,
    width: box.width,
    height: box.height * 0.94,
  }),
);
files.push(
  await shot("desk-hands-zoom", {
    x: box.x + box.width * 0.02,
    y: box.y + box.height * 0.4,
    width: box.width * 0.96,
    height: box.height * 0.52,
  }),
);
files.push(
  await shot("table-surface-zoom", {
    x: box.x + box.width * 0.05,
    y: box.y + box.height * 0.48,
    width: box.width * 0.9,
    height: box.height * 0.42,
  }),
);
files.push(
  await shot("chest-stanag-killa", {
    x: box.x + box.width * 0.12,
    y: box.y + box.height * 0.28,
    width: box.width * 0.76,
    height: box.height * 0.4,
  }),
);

await browser.close();

const pass =
  meta.orderOk &&
  meta.noBadHandOffset &&
  meta.leftOnKb &&
  meta.rightOnMouse &&
  meta.hasDeskTop &&
  meta.hasApron &&
  meta.stanagCentered &&
  meta.killaUnderPouches &&
  meta.killaWide &&
  meta.hasKilla &&
  meta.hasMolle &&
  meta.hasVestWear &&
  meta.kbIsRect &&
  meta.kbStroke === "#4a4a4a" &&
  meta.hasMousepad &&
  String(meta.torsoClip).includes("torso-above-desk") &&
  meta.headSmaller &&
  meta.hasDeskRgb &&
  meta.skinHands;

const note = { ts, pass, meta, files };
writeFileSync(resolve(mediaStore, `avatar-proof-${ts}-hands-desk-fix-note.json`), JSON.stringify(note, null, 2));
writeFileSync(resolve("_proofs", `avatar-proof-${ts}-hands-desk-fix-note.json`), JSON.stringify(note, null, 2));
console.log(
  pass ? "PROOF_OK" : "PROOF_FAIL",
  JSON.stringify({
    pass,
    orderOk: meta.orderOk,
    leftOnKb: meta.leftOnKb,
    rightOnMouse: meta.rightOnMouse,
    killaUnderPouches: meta.killaUnderPouches,
    headSmaller: meta.headSmaller,
    hasDeskRgb: meta.hasDeskRgb,
    skinHands: meta.skinHands,
  }),
);
process.exit(pass ? 0 : 1);
