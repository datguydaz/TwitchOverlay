import { readFileSync, writeFileSync } from "fs";
import { PNG } from "pngjs";
import { resolve } from "path";

const media = process.argv[2];
const file = resolve(media, "avatar-proof-20261111-kb-arm-match-v36-left-mass-only-nostripe.png");
const png = PNG.sync.read(readFileSync(file));
const { width: w, height: h, data } = png;

function at(x, y) {
  const i = (y * w + x) * 4;
  return [data[i], data[i + 1], data[i + 2]];
}
function kind([r, g, b]) {
  if (Math.abs(r - 122) < 28 && Math.abs(g - 122) < 28 && Math.abs(b - 122) < 28) return "GRAY";
  if (g > b + 6 && r > 55 && r < 170 && g > 65 && g < 170) return "OLIVE";
  if (r < 50 && g < 55 && b < 65) return "SLEEVE";
  if (r > 150 && g > 120 && b > 80 && r < 230) return "HAND";
  if (r < 40 && g < 45 && b < 70 && b >= g) return "CHAIR";
  return `other(${r},${g},${b})`;
}

// Scan several rows across the crop; print run-length of kinds
const rows = [0.22, 0.28, 0.34, 0.4, 0.46, 0.52].map((t) => Math.floor(h * t));
for (const y of rows) {
  const runs = [];
  let cur = null,
    start = 0;
  for (let x = 0; x < w; x++) {
    const k = kind(at(x, y));
    const kk = k.startsWith("other") ? "OTHER" : k;
    if (kk !== cur) {
      if (cur) runs.push(`${cur}:${x - start}`);
      cur = kk;
      start = x;
    }
  }
  if (cur) runs.push(`${cur}:${w - start}`);
  // Also find GRAY runs that sit between SLEEVE and OLIVE
  let corridor = false;
  const seq = runs.map((r) => r.split(":")[0]);
  for (let i = 0; i < seq.length - 2; i++) {
    if (seq[i] === "SLEEVE" && seq[i + 1] === "GRAY" && seq[i + 2] === "OLIVE") corridor = true;
    if (seq[i] === "SLEEVE" && seq[i + 1] === "CHAIR" && seq[i + 2] === "OLIVE") corridor = true;
    if (seq[i] === "SLEEVE" && seq[i + 1] === "OTHER" && seq[i + 2] === "OLIVE") corridor = true;
  }
  console.log(`y=${y}/${h}`, "corridor="+corridor, runs.join(" | "));
}

// Annotate: paint red any GRAY pixel that has SLEEVE to the left and OLIVE to the right on same row
const out = new PNG({ width: w, height: h });
out.data.set(data);
let marked = 0;
for (let y = Math.floor(h * 0.15); y < Math.floor(h * 0.55); y++) {
  for (let x = 2; x < w - 2; x++) {
    if (kind(at(x, y)) !== "GRAY") continue;
    let leftSleeve = false,
      rightOlive = false;
    for (let lx = x - 1; lx >= Math.max(0, x - 80); lx--) {
      const k = kind(at(lx, y));
      if (k === "SLEEVE") {
        leftSleeve = true;
        break;
      }
      if (k === "OLIVE") break;
    }
    for (let rx = x + 1; rx <= Math.min(w - 1, x + 80); rx++) {
      const k = kind(at(rx, y));
      if (k === "OLIVE") {
        rightOlive = true;
        break;
      }
      if (k === "SLEEVE") break;
    }
    if (leftSleeve && rightOlive) {
      const i = (y * w + x) * 4;
      out.data[i] = 255;
      out.data[i + 1] = 0;
      out.data[i + 2] = 0;
      marked++;
    }
  }
}
const outPath = resolve(media, "avatar-proof-20261111-kb-arm-match-v36-corridor-mark.png");
writeFileSync(outPath, PNG.sync.write(out));
console.log("marked corridor pixels", marked, "->", outPath);
