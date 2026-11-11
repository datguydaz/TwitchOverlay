import { chromium } from "playwright";
import { resolve } from "node:path";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { PNG } from "pngjs";

const ts = process.env.PROOF_TS || `20261111-kb-arm-match-v29`;
const mediaStore =
  process.env.MEDIA_STORE ||
  "C:/Users/Pontu/AppData/Local/Cursor/AgentStores/cursor_agent_stores/bc-6576559c-832b-4d18-9dcb-93d96646477f/files/media";
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

const geo = await page.evaluate(() => {
  const box = (el) => {
    if (!el?.getBBox) return null;
    const b = el.getBBox();
    return { x: +b.x.toFixed(2), y: +b.y.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2), r: +(b.x + b.width).toFixed(2), btm: +(b.y + b.height).toFixed(2) };
  };
  const screen = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), r: +(r.x + r.width).toFixed(1), btm: +(r.y + r.height).toFixed(1) };
  };
  const left = document.querySelector("#sleeve-left-fill");
  const right = document.querySelector("#sleeve-right-fill");
  const vest = document.querySelector("#plate-carrier");
  const vestFront = document.querySelector("#vest-front");
  const kids = [...(document.querySelector("#operator")?.children || [])].map((e) => e.id || e.tagName);
  return {
    leftD: left?.getAttribute("d") || "",
    rightD: right?.getAttribute("d") || "",
    leftBox: box(left),
    rightBox: box(right),
    vestBox: box(vest),
    leftScreen: screen(left),
    rightScreen: screen(right),
    vestScreen: screen(vest),
    vestAfterHands: kids.indexOf("vest-front") > kids.indexOf("hand-left") && kids.indexOf("vest-front") > kids.indexOf("hand-right"),
    handLeftAimTx: document.querySelector("#hand-left-aim")?.getAttribute("transform") || "",
    handRightAimTx: document.querySelector("#hand-right-aim")?.getAttribute("transform") || "",
    vestFrontPresent: !!vestFront,
  };
});
console.log("geo", JSON.stringify(geo, null, 2));

const root = page.locator(".avatar-root");
const box = await root.boundingBox();
if (!box) throw new Error("no avatar-root box");

const shot = async (name, clip) => {
  const file = `avatar-proof-${ts}-${name}.png`;
  await page.screenshot({ path: resolve(mediaStore, file), clip, type: "png" });
  await page.screenshot({ path: resolve("_proofs", file), clip, type: "png" });
  console.log("wrote", file);
  return resolve(mediaStore, file);
};

const restClip = {
  x: box.x + box.width * 0.05,
  y: box.y + box.height * 0.12,
  width: box.width * 0.9,
  height: box.height * 0.55,
};
const pairClip = {
  x: box.x + box.width * 0.12,
  y: box.y + box.height * 0.18,
  width: box.width * 0.76,
  height: box.height * 0.42,
};

async function junctionClips() {
  return page.evaluate(() => {
    const vest = document.querySelector("#plate-carrier");
    const left = document.querySelector("#sleeve-left-fill");
    const right = document.querySelector("#sleeve-right-fill");
    const root = document.querySelector(".avatar-root");
    if (!vest || !left || !right || !root) return null;
    const vr = vest.getBoundingClientRect();
    const lr = left.getBoundingClientRect();
    const rr = right.getBoundingClientRect();
    const pad = 18;
    const leftClip = {
      x: Math.max(0, Math.min(lr.left, vr.left) - pad),
      y: Math.max(0, Math.min(lr.top, vr.top) - pad),
      width: 0,
      height: 0,
    };
    leftClip.width = Math.min(window.innerWidth, Math.max(lr.right, vr.left + vr.width * 0.45) + pad) - leftClip.x;
    leftClip.height = Math.min(window.innerHeight, Math.max(lr.top + lr.height * 0.55, vr.top + vr.height * 0.55) + pad) - leftClip.y;
    // Tight armpit: bias toward vest left edge
    const jl = {
      x: Math.max(0, vr.left - 140),
      y: Math.max(0, vr.top - 20),
      width: 280,
      height: 240,
    };
    const jr = {
      x: Math.max(0, vr.right - 140),
      y: Math.max(0, vr.top - 20),
      width: 280,
      height: 240,
    };
    return { jl, jr, leftClip, lr: { x: lr.x, y: lr.y, w: lr.width, h: lr.height }, rr: { x: rr.x, y: rr.y, w: rr.width, h: rr.height }, vr: { x: vr.x, y: vr.y, w: vr.width, h: vr.height } };
  });
}

const setBg = async (kind) => {
  await page.evaluate((k) => {
    document.body.style.background = k === "magenta" ? "#ff00aa" : "radial-gradient(circle at 40% 30%, #2a2a2a, #0a0a0a 72%)";
  }, kind);
  await page.waitForTimeout(80);
};

const setInput = async (mode) => {
  await page.evaluate((m) => {
    const r = document.querySelector(".avatar-root");
    if (!r) return;
    r.dataset.source = "demo";
    r.dataset.active = "1";
    r.dataset.mouseL = "0";
    r.dataset.mouseR = "0";
    r.dataset.key = "0";
    r.querySelectorAll(".kb-key[data-pressed]").forEach((el) => el.removeAttribute("data-pressed"));
    const leftAim = r.querySelector("#hand-left-aim");
    const rightAim = r.querySelector("#hand-right-aim");
    leftAim?.removeAttribute("transform");
    rightAim?.removeAttribute("transform");
    leftAim?.setAttribute("style", "");
    rightAim?.setAttribute("style", "");
    // Force rest / max poses via transform on aim nodes (same pivots as runtime)
    if (m === "max-kb") {
      leftAim?.setAttribute("transform", "translate(2 -1) rotate(-7)");
      r.dataset.key = "1";
      r.querySelector('.kb-key[data-slot="1"]')?.setAttribute("data-pressed", "1");
    } else if (m === "max-mouse") {
      rightAim?.setAttribute("transform", "rotate(7)");
      r.dataset.mouseL = "1";
    } else if (m === "both") {
      leftAim?.setAttribute("transform", "translate(2 -1) rotate(-6)");
      rightAim?.setAttribute("transform", "rotate(6)");
      r.dataset.key = "1";
      r.dataset.mouseL = "1";
    } else if (m === "breath") {
      // leave transforms empty; CSS breath continues
    }
  }, mode);
  await page.waitForTimeout(mode === "breath" ? 900 : 180);
};

const files = {};

await setBg("dark");
await setInput("rest");
files.rest = await shot("rest", restClip);
files.pairRest = await shot("pair-rest", pairClip);
let jc = await junctionClips();
console.log("junctionClips rest", JSON.stringify(jc));
files.junctionLeft = await shot("junction-left", jc.jl);
files.junctionRight = await shot("junction-right", jc.jr);

await setBg("magenta");
await setInput("rest");
jc = await junctionClips();
files.pairMagenta = await shot("pair-magenta", pairClip);
files.junctionLeftMagenta = await shot("junction-left-magenta", jc.jl);
files.junctionRightMagenta = await shot("junction-right-magenta", jc.jr);

await setBg("dark");
await setInput("breath");
files.breath = await shot("breath", restClip);
files.pairBreath = await shot("pair-breath", pairClip);

await setInput("max-kb");
jc = await junctionClips();
files.maxKb = await shot("max-kb", restClip);
files.pairMaxKb = await shot("pair-max-kb", pairClip);
files.junctionLeftMaxKb = await shot("junction-left-maxkb", jc.jl);
files.junctionRightMaxKb = await shot("junction-right-maxkb", jc.jr);

await setInput("max-mouse");
jc = await junctionClips();
files.maxMouse = await shot("max-mouse", restClip);
files.pairMaxMouse = await shot("pair-max-mouse", pairClip);
files.junctionLeftMaxMouse = await shot("junction-left-maxmouse", jc.jl);
files.junctionRightMaxMouse = await shot("junction-right-maxmouse", jc.jr);

await setInput("both");
files.both = await shot("both", restClip);
files.pairBoth = await shot("pair-both", pairClip);

await setInput("rest");
files.afterRelease = await shot("after-release", restClip);

function analyze(path, side) {
  const png = PNG.sync.read(readFileSync(path));
  const { width: w, height: h, data } = png;
  const isOlive = (r, g, b) => g > 70 && r > 40 && r < 170 && g < 190 && g >= r * 0.88 && g > b * 1.02 && !(r > 200 && g > 200);
  const isMag = (r, g, b) => r > 200 && b > 140 && g < 120;
  const isSleeve = (r, g, b) => r < 40 && g < 40 && b < 45 && r + g + b < 100;
  const isStripe = (r, g, b) => r > 180 && g > 170 && b > 150 && Math.abs(r - g) < 30;
  let magBetween = 0;
  let rowsGap = 0;
  let rowsOk = 0;
  const samples = [];
  // Only score rows where sleeve black already exists somewhere on the arm side
  // (ignore neck/above-sleeve vest tip rows — those always show bg beside olive).
  for (let y = Math.floor(h * 0.02); y < Math.floor(h * 0.72); y += 2) {
    let hasSleeveRow = false;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (isSleeve(data[i], data[i + 1], data[i + 2]) || isStripe(data[i], data[i + 1], data[i + 2])) {
        hasSleeveRow = true;
        break;
      }
    }
    if (!hasSleeveRow) continue;

    let oliveEdge = -1;
    if (side === "left") {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (isOlive(data[i], data[i + 1], data[i + 2])) {
          oliveEdge = x;
          break;
        }
      }
      if (oliveEdge < 8) continue;
      let sawMag = false;
      let sawSleeve = false;
      let gap = 0;
      for (let x = oliveEdge - 1; x >= Math.max(0, oliveEdge - 48); x--) {
        const i = (y * w + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (isOlive(r, g, b)) continue;
        if (isSleeve(r, g, b) || isStripe(r, g, b)) {
          sawSleeve = true;
          break;
        }
        if (isMag(r, g, b)) {
          sawMag = true;
          gap++;
          magBetween++;
          continue;
        }
        // dark outline of vest — allow a few px
        if (r < 70 && g < 65 && b < 55) continue;
        gap++;
      }
      if (sawMag && gap > 0) rowsGap++;
      else if (sawSleeve) rowsOk++;
      if (samples.length < 10) samples.push({ y, oliveEdge, sawSleeve, sawMag, gap });
    } else {
      for (let x = w - 1; x >= 0; x--) {
        const i = (y * w + x) * 4;
        if (isOlive(data[i], data[i + 1], data[i + 2])) {
          oliveEdge = x;
          break;
        }
      }
      if (oliveEdge < 0 || oliveEdge > w - 8) continue;
      let sawMag = false;
      let sawSleeve = false;
      let gap = 0;
      for (let x = oliveEdge + 1; x <= Math.min(w - 1, oliveEdge + 48); x++) {
        const i = (y * w + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (isOlive(r, g, b)) continue;
        if (isSleeve(r, g, b) || isStripe(r, g, b)) {
          sawSleeve = true;
          break;
        }
        if (isMag(r, g, b)) {
          sawMag = true;
          gap++;
          magBetween++;
          continue;
        }
        if (r < 70 && g < 65 && b < 55) continue;
        gap++;
      }
      if (sawMag && gap > 0) rowsGap++;
      else if (sawSleeve) rowsOk++;
      if (samples.length < 10) samples.push({ y, oliveEdge, sawSleeve, sawMag, gap });
    }
  }
  return { w, h, magBetween, rowsGap, rowsOk, samples };
}

const qa = {
  leftMagenta: analyze(files.junctionLeftMagenta, "left"),
  rightMagenta: analyze(files.junctionRightMagenta, "right"),
  leftRest: analyze(files.junctionLeft, "left"),
  rightRest: analyze(files.junctionRight, "right"),
  leftMaxKb: analyze(files.junctionLeftMaxKb, "left"),
  rightMaxMouse: analyze(files.junctionRightMaxMouse, "right"),
};

const note = {
  ts,
  geo,
  files,
  qa,
  passHint:
    qa.leftMagenta.magBetween === 0 &&
    qa.rightMagenta.magBetween === 0 &&
    qa.leftMagenta.rowsGap === 0 &&
    qa.rightMagenta.rowsGap === 0,
};
writeFileSync(resolve(mediaStore, `avatar-proof-${ts}-meta.json`), JSON.stringify(note, null, 2));
writeFileSync(resolve("_proofs", `avatar-proof-${ts}-meta.json`), JSON.stringify(note, null, 2));
console.log("QA", JSON.stringify(qa, null, 2));
console.log("passHint", note.passHint);

await browser.close();
