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
  const killa = document.querySelector("#chest-killa-main");
  const kbShell = document.querySelector("#prop-keyboard > rect");
  const css = [...document.styleSheets]
    .flatMap((s) => {
      try {
        return [...s.cssRules];
      } catch {
        return [];
      }
    })
    .filter((r) => r.type === CSSRule.KEYFRAMES_RULE)
    .map((r) => r.name);
  const headAnim = getComputedStyle(document.querySelector("#layer-head")).animationName;
  const torsoAnim = getComputedStyle(document.querySelector("#layer-torso")).animationName;
  const headDur = getComputedStyle(document.querySelector("#layer-head")).animationDuration;
  return {
    hasKilla: !!killa && killa.textContent === "KILLA",
    killaScratches: document.querySelectorAll("#chest-killa-scratches path").length,
    kbIsRect: kbShell?.tagName.toLowerCase() === "rect",
    kbStroke: kbShell?.getAttribute("stroke"),
    hasMousepad: !!document.querySelector("#prop-mousepad"),
    hasGrain: !!document.querySelector("#desk-grain"),
    headAnim,
    torsoAnim,
    headDur,
    hasTalkNod: css.includes("talk-nod"),
    hasBreath: css.includes("breath"),
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
  await shot("killa-chest-full", {
    x: box.x,
    y: box.y + box.height * 0.06,
    width: box.width,
    height: box.height * 0.9,
  }),
);
files.push(
  await shot("killa-chest-close", {
    x: box.x + box.width * 0.2,
    y: box.y + box.height * 0.28,
    width: box.width * 0.6,
    height: box.height * 0.36,
  }),
);

await page.evaluate(() => {
  const r = document.querySelector(".avatar-root");
  if (!r) return;
  r.dataset.talk = "2";
  r.dataset.talkNod = "1";
});
await page.waitForTimeout(180);
files.push(
  await shot("talk-head-nod", {
    x: box.x + box.width * 0.15,
    y: box.y + box.height * 0.08,
    width: box.width * 0.7,
    height: box.height * 0.5,
  }),
);

await browser.close();

const pass =
  meta.hasKilla &&
  meta.killaScratches >= 4 &&
  meta.kbIsRect &&
  meta.kbStroke === "#4a4a4a" &&
  meta.hasMousepad &&
  meta.hasGrain &&
  meta.headAnim.includes("head-idle");

const note = {
  ts,
  pass,
  meta,
  files,
  motion:
    "Breath/talk-lean reduced; head-idle + talk-nod amplified; head cycle ~8.5s.",
};
writeFileSync(resolve(mediaStore, `avatar-proof-${ts}-killa-motion-note.json`), JSON.stringify(note, null, 2));
writeFileSync(resolve("_proofs", `avatar-proof-${ts}-killa-motion-note.json`), JSON.stringify(note, null, 2));
console.log(pass ? "PROOF_OK" : "PROOF_FAIL", JSON.stringify({ pass, killa: meta.hasKilla, scratches: meta.killaScratches, kb: meta.kbIsRect }));
process.exit(pass ? 0 : 1);
