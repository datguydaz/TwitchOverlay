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
  const kb = document.querySelector("#prop-keyboard");
  const mouse = document.querySelector("#prop-mouse");
  const wear = [...document.querySelectorAll(".kb-label.wear-a, .kb-label.wear-b, .kb-label.wear-c, .kb-label.wear-d, .kb-label.wear-e")];
  const labels = [...document.querySelectorAll(".avatar-root .kb-label")].map((t) => t.textContent);
  const opacities = wear.slice(0, 8).map((el) => getComputedStyle(el).opacity);
  return {
    kbTransform: kb?.getAttribute("transform") || "",
    mouseTransform: mouse?.getAttribute("transform") || "",
    hasDeskWear: !!document.querySelector("#desk-wear"),
    deskWearPaths: document.querySelectorAll("#desk-wear path").length,
    hasHelmWear: !!document.querySelector("#helm-wear"),
    helmWearPaths: document.querySelectorAll("#helm-wear path").length,
    wornLabelCount: wear.length,
    opacities,
    hasNordic: labels.includes("Å") && labels.includes("Ö") && labels.includes("Ä"),
    kbIsRectShell: !!kb?.querySelector("rect"),
    hasLmb: !!document.querySelector("#mouse-lmb"),
    hasRmb: !!document.querySelector("#mouse-rmb"),
    hasWheel: !!document.querySelector("#mouse-wheel"),
    cloakFlareGone: !(document.querySelector("#layer-torso > path")?.getAttribute("d") || "").includes("L338 236"),
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
  await shot("full-wear-ondesk", {
    x: box.x,
    y: box.y + box.height * 0.05,
    width: box.width,
    height: box.height * 0.9,
  }),
);
files.push(
  await shot("kb-mouse-ondesk-worn-keys", {
    x: box.x + box.width * 0.02,
    y: box.y + box.height * 0.48,
    width: box.width * 0.96,
    height: box.height * 0.46,
  }),
);
files.push(
  await shot("helm-scuffs", {
    x: box.x + box.width * 0.22,
    y: box.y + box.height * 0.08,
    width: box.width * 0.56,
    height: box.height * 0.38,
  }),
);
files.push(
  await shot("desk-crack-scuff", {
    x: box.x + box.width * 0.05,
    y: box.y + box.height * 0.55,
    width: box.width * 0.9,
    height: box.height * 0.38,
  }),
);

await browser.close();

const ok =
  meta.hasDeskWear &&
  meta.deskWearPaths >= 3 &&
  meta.hasHelmWear &&
  meta.helmWearPaths >= 4 &&
  meta.wornLabelCount >= 20 &&
  meta.kbTransform.includes("matrix") &&
  meta.mouseTransform.includes("matrix") &&
  meta.hasNordic &&
  meta.hasLmb &&
  meta.hasRmb &&
  meta.hasWheel &&
  meta.cloakFlareGone;

const note = {
  ts,
  ok,
  meta,
  files,
  summary:
    "On-desk 3/4 KB+mouse, worn key legend opacities, desk crack/scuffs, subtle helm scratches. Silhouette/stripes/input unchanged.",
};
writeFileSync(resolve(mediaStore, `avatar-proof-${ts}-wear-note.json`), JSON.stringify(note, null, 2));
writeFileSync(resolve("_proofs", `avatar-proof-${ts}-wear-note.json`), JSON.stringify(note, null, 2));
console.log(ok ? "PROOF_OK" : "PROOF_FAIL", JSON.stringify({ ok, desk: meta.deskWearPaths, helm: meta.helmWearPaths, worn: meta.wornLabelCount }));
process.exit(ok ? 0 : 1);
