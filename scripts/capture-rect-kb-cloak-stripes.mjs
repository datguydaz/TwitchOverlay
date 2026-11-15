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
await page.waitForTimeout(450);

const meta = await page.evaluate(() => {
  const labels = [...document.querySelectorAll(".avatar-root .kb-label")].map((t) => t.textContent);
  const kb = document.querySelector("#prop-keyboard");
  const outer = kb?.querySelector("rect");
  const paths = [...(kb?.querySelectorAll("path") || [])].map((p) => p.getAttribute("d") || "");
  const torso = document.querySelector("#layer-torso > path");
  const torsoD = torso?.getAttribute("d") || "";
  const left = document.querySelector("#sleeve-stripes-left");
  const stripePaths = left ? left.querySelectorAll("path").length : 0;
  const right = document.querySelector("#sleeve-stripes-right");
  const stripePathsR = right ? right.querySelectorAll("path").length : 0;
  const box = (el) => {
    if (!el || !el.getBBox) return null;
    const b = el.getBBox();
    return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) };
  };
  const spcY = Number(document.querySelector("#kb-s26 rect")?.getAttribute("y"));
  const qY = Number(document.querySelector("#kb-s0 rect")?.getAttribute("y"));
  return {
    hasNordic: labels.includes("Å") && labels.includes("Ö") && labels.includes("Ä") && labels.includes("SPC"),
    kbIsRect: !!outer && outer.tagName.toLowerCase() === "rect",
    kbOuter: {
      x: outer?.getAttribute("x"),
      y: outer?.getAttribute("y"),
      w: outer?.getAttribute("width"),
      h: outer?.getAttribute("height"),
    },
    hasTrapezoidPath: paths.some((d) => /L\s*2\d\d\s+2\d\d\s+L\s*\d+\s+2\d\d/i.test(d) || d.includes("L256 288") || d.includes("L44 288")),
    cloakFlareGone: !torsoD.includes("L338 236") && !torsoD.includes("L62 236"),
    torsoD: torsoD.slice(0, 80),
    stripeCountL: stripePaths,
    stripeCountR: stripePathsR,
    stripesL: box(left),
    fillL: box(document.querySelector("#sleeve-left-fill")),
    spcTowardHim: spcY < qY,
    hasWheel: !!document.querySelector("#mouse-wheel"),
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

const fullClip = {
  x: box.x,
  y: box.y + box.height * 0.08,
  width: box.width,
  height: box.height * 0.86,
};
const kbClip = {
  x: box.x + box.width * 0.02,
  y: box.y + box.height * 0.52,
  width: box.width * 0.7,
  height: box.height * 0.4,
};
const torsoClip = {
  x: box.x + box.width * 0.08,
  y: box.y + box.height * 0.26,
  width: box.width * 0.84,
  height: box.height * 0.4,
};

await page.evaluate(() => {
  const r = document.querySelector(".avatar-root");
  if (!r) return;
  r.dataset.source = "demo";
  r.dataset.active = "1";
  r.dataset.key = "0";
  r.dataset.mouseL = "0";
  r.dataset.mouseR = "0";
  delete r.dataset.wheel;
});
await page.waitForTimeout(120);

const files = [];
files.push(await shot("silhouette-no-cloak", fullClip));
files.push(await shot("rect-keyboard-nordic", kbClip));
files.push(await shot("sleeve-stripes-triple", torsoClip));

await page.evaluate(() => {
  const r = document.querySelector(".avatar-root");
  if (!r) return;
  r.dataset.key = "1";
  const k = document.querySelector("#kb-s13");
  k?.classList.add("pressed");
});
await page.waitForTimeout(80);
files.push(await shot("key-press-react", kbClip));

await page.evaluate(() => {
  const r = document.querySelector(".avatar-root");
  if (!r) return;
  r.dataset.key = "0";
  r.dataset.wheel = "up";
  document.querySelector("#kb-s13")?.classList.remove("pressed");
});
await page.waitForTimeout(80);
files.push(await shot("wheel-pulse", {
  x: box.x + box.width * 0.48,
  y: box.y + box.height * 0.5,
  width: box.width * 0.48,
  height: box.height * 0.42,
}));

await browser.close();

const ok =
  meta.kbIsRect &&
  !meta.hasTrapezoidPath &&
  meta.cloakFlareGone &&
  meta.stripeCountL === 3 &&
  meta.stripeCountR === 3 &&
  meta.hasNordic &&
  meta.spcTowardHim;

const note = {
  ts,
  ok,
  meta,
  files,
  inputNote:
    "Live key/scroll events require the Windows companion (`npm run companion` or `cd companion && npm start`). Dashboard Last input shows kind including wheelUp/wheelDown when companion is connected and Demo preview is OFF. Soft-refresh avatar.html after rebuild; restart companion after companion edits.",
};
writeFileSync(resolve(mediaStore, `avatar-proof-${ts}-input-note.json`), JSON.stringify(note, null, 2));
writeFileSync(resolve("_proofs", `avatar-proof-${ts}-input-note.json`), JSON.stringify(note, null, 2));
console.log(ok ? "PROOF_OK" : "PROOF_FAIL", JSON.stringify({ ok, kbIsRect: meta.kbIsRect, cloakFlareGone: meta.cloakFlareGone, stripes: [meta.stripeCountL, meta.stripeCountR] }));
process.exit(ok ? 0 : 1);
