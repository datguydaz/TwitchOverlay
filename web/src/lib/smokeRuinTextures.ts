/**
 * Procedural Tarkov-ruin textures for ultrawide-smoke bars.
 * Canvas noise / irregular profiles — no geometric tile patterns.
 */

type EdgeSide = "bottom" | "top";

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(x: number, y: number, seed: number): number {
  let n = Math.imul(x + seed * 374761393, 1274126177) ^ Math.imul(y, 1103515245);
  n = (n ^ (n >>> 13)) >>> 0;
  return (n % 10000) / 10000;
}

function valueNoise2(x: number, y: number, seed: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash2(x0, y0, seed);
  const b = hash2(x0 + 1, y0, seed);
  const c = hash2(x0, y0 + 1, seed);
  const d = hash2(x0 + 1, y0 + 1, seed);
  const u = a + (b - a) * sx;
  const v = c + (d - c) * sx;
  return u + (v - u) * sy;
}

function fbm(x: number, y: number, seed: number, octaves = 4): number {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise2(x * freq, y * freq, seed + i * 97);
    norm += amp;
    amp *= 0.5;
    freq *= 2.05;
  }
  return sum / norm;
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

/**
 * Shallow torn-edge profile: one consistent baseline across the full width,
 * with only small irregular grit chips — no deep side bites / center steps.
 */
function buildTornProfile(
  _width: number,
  maxDepth: number,
  seed: number,
  samples = 96,
): Float32Array {
  const rnd = mulberry32(seed);
  const profile = new Float32Array(samples + 1);
  // Tight baseline (~70% of maxDepth) so L/C/R share one edge; grit is ±small only
  const baseline = maxDepth * 0.7;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const nLo = fbm(t * 6, 0.2, seed, 3);
    const nMid = fbm(t * 18, 0.7, seed + 3, 2);
    // Tiny grit only — amplitude capped so no visible shelf/step across width
    let d = baseline + (nLo - 0.5) * maxDepth * 0.16 + (nMid - 0.5) * maxDepth * 0.1;
    if (rnd() < 0.1) d += maxDepth * (0.05 + rnd() * 0.1);
    if (rnd() < 0.08) d -= maxDepth * (0.04 + rnd() * 0.08);
    profile[i] = Math.max(maxDepth * 0.45, Math.min(maxDepth, d));
  }
  // Heavy smooth → continuous baseline (no stepped L/R vs centre)
  const copy = profile.slice();
  for (let pass = 0; pass < 2; pass++) {
    const src = profile.slice();
    for (let i = 1; i < samples; i++) {
      profile[i] = src[i - 1] * 0.3 + src[i] * 0.4 + src[i + 1] * 0.3;
    }
  }
  void copy;
  return profile;
}

/** Sample profile at pixel x with fine chip noise (no center-depth cap / no big steps). */
function depthAt(
  profile: Float32Array,
  x: number,
  barW: number,
  seed: number,
  _side?: EdgeSide,
): number {
  const n = profile.length - 1;
  const t = (x / Math.max(1, barW - 1)) * n;
  const i = Math.floor(t);
  const f = t - i;
  const a = profile[Math.max(0, Math.min(n, i))];
  const b = profile[Math.max(0, Math.min(n, i + 1))];
  const base = a + (b - a) * f;
  const chip = (fbm(x * 0.55, 2.2, seed, 2) - 0.5) * 1.6;
  const micro = (hash2(x, seed, seed) - 0.5) * 0.9;
  return Math.max(2.5, Math.min(maxDepthSafe(profile), base + chip + micro));
}

function maxDepthSafe(profile: Float32Array): number {
  let m = 0;
  for (let i = 0; i < profile.length; i++) m = Math.max(m, profile[i]);
  return Math.max(8, m + 1.5);
}

/** Alpha mask: opaque bar with irregular torn edge (raster, not clip-path). */
function buildTornMask(
  barW: number,
  barH: number,
  profile: Float32Array,
  side: EdgeSide,
  seed: number,
): string {
  const c = makeCanvas(barW, barH);
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(barW, barH);
  const d = img.data;
  for (let x = 0; x < barW; x++) {
    const depth = depthAt(profile, x, barW, seed, side);
    for (let y = 0; y < barH; y++) {
      const i = (y * barW + x) * 4;
      let keep = true;
      if (side === "bottom") keep = y < barH - depth;
      else keep = y >= depth;
      // Soften only 1px at the cut so it isn't a hard vector line
      if (side === "bottom" && y >= barH - depth - 1 && y < barH - depth + 1) {
        keep = hash2(x, y, seed) > 0.35;
      }
      if (side === "top" && y >= depth - 1 && y < depth + 1) {
        keep = hash2(x, y, seed + 1) > 0.35;
      }
      d[i] = d[i + 1] = d[i + 2] = 255;
      d[i + 3] = keep ? 255 : 0;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL("image/png");
}

export type SmokeEdgeStyle = "red" | "steel" | "rust" | "phosphor" | "blackout";

export function resolveSmokeEdgeStyle(stage?: HTMLElement | null): SmokeEdgeStyle {
  const fromData = (stage?.dataset.edge || "").toLowerCase();
  let raw = fromData;
  if (!raw) {
    try {
      raw = (new URLSearchParams(location.search).get("edge") || "").toLowerCase();
    } catch {
      raw = "";
    }
  }
  if (raw === "steel" || raw === "rust" || raw === "phosphor" || raw === "blackout" || raw === "red") {
    return raw;
  }
  // Default stays current red until user picks a new style
  return "red";
}

/**
 * Mean lip thickness into the bar (not stage).
 * Kept modest (~original hairline × ~2) so a bevel can read as metal, not a flat paint stripe.
 */
export function smokeEdgeStripH(style: SmokeEdgeStyle = "red"): number {
  if (style === "blackout") return 6.5;
  if (style === "phosphor") return 5;
  // Modest bulk (~2× original hairline) — bevel/texture do the work, not a fat flat band
  return 6;
}

/** How far UI must stay clear of the torn cut (torn grit + lip + AO + margin). */
export function smokeEdgeClearPx(
  tornDepth: number,
  style: SmokeEdgeStyle = "red",
): number {
  const stripH = smokeEdgeStripH(style);
  return Math.round(tornDepth + stripH + 6);
}

/** Palette for beveled lip face (steel is authored; others remap hue). */
function lipPalette(style: SmokeEdgeStyle): {
  spec: [number, number, number];
  face: [number, number, number];
  under: [number, number, number];
  rust: [number, number, number];
  ao: [number, number, number];
} {
  if (style === "rust") {
    return {
      spec: [140, 78, 42],
      face: [72, 34, 18],
      under: [36, 16, 10],
      rust: [96, 40, 16],
      ao: [8, 4, 3],
    };
  }
  if (style === "red") {
    return {
      spec: [150, 48, 32],
      face: [78, 28, 20],
      under: [40, 14, 12],
      rust: [110, 36, 22],
      ao: [10, 4, 4],
    };
  }
  if (style === "phosphor") {
    return {
      spec: [140, 170, 120],
      face: [48, 68, 46],
      under: [22, 32, 22],
      rust: [70, 90, 55],
      ao: [6, 10, 6],
    };
  }
  if (style === "blackout") {
    return {
      spec: [70, 72, 68],
      face: [22, 24, 22],
      under: [10, 11, 10],
      rust: [40, 28, 20],
      ao: [4, 4, 4],
    };
  }
  // steel — cold bare metal (high tip/under contrast so bevel survives stream downscale)
  return {
    spec: [228, 230, 218],
    face: [78, 82, 76],
    under: [28, 30, 28],
    rust: [88, 48, 28],
    ao: [4, 5, 4],
  };
}

/**
 * Physical torn-edge lip (`?edge=`). Steel is the reference:
 * bevel (specular → face → under → AO) + fBm steel texture + variable thickness
 * along the torn outline. Grows into the bar only — stage stays transparent.
 */
function drawTornRustStrip(
  ctx: CanvasRenderingContext2D,
  profile: Float32Array,
  barW: number,
  barH: number,
  side: EdgeSide,
  seed: number,
  style: SmokeEdgeStyle = "red",
): void {
  const meanH = smokeEdgeStripH(style);
  const pal = lipPalette(style);
  const img = ctx.createImageData(barW, barH);
  const d = img.data;
  const into = side === "bottom" ? -1 : 1; // +y toward stage for top-bar bottom edge is -1 into bar

  for (let x = 0; x < barW; x++) {
    const depth = depthAt(profile, x, barW, seed, side);
    const edgeY = side === "bottom" ? barH - depth : depth;
    // Thickness varies along the tear — never a uniform paint stripe
    const thickN = fbm(x * 0.011, 0.4, seed + 17, 3);
    const chipN = fbm(x * 0.07, 1.1, seed + 29, 2);
    let lipH = meanH * (0.72 + thickN * 0.55) + (chipN - 0.5) * 1.8;
    // Occasional weld lump / thickened scar
    const lump = hash2(Math.floor(x / 47), seed, seed + 3);
    if (lump > 0.82) lipH += 1.2 + (lump - 0.82) * 8;
    lipH = Math.max(3.2, Math.min(meanH + 4.5, lipH));
    const aoSpan = 2.5 + thickN * 1.5;

    for (let dy = 0; dy < lipH + aoSpan + 1; dy++) {
      const y = Math.floor(edgeY + into * (0.35 + dy));
      if (y < 0 || y >= barH) continue;
      const i = (y * barW + x) * 4;
      const t = dy / Math.max(0.001, lipH); // 0 at outer cut → 1 at inner face end
      // Micro-structure: scratches (anisotropic), pitting, light rust
      const grit = fbm(x * 0.09, dy * 0.55, seed + 3, 3);
      const scratch = fbm(x * 0.22, dy * 0.08, seed + 11, 2);
      const pit = fbm(x * 0.35, dy * 0.4, seed + 19, 2);
      const rustN = fbm(x * 0.04, dy * 0.25, seed + 41, 3);

      let r: number;
      let g: number;
      let b: number;
      let a: number;

      if (dy <= 0.9) {
        // Outer specular hairline — thin, hot, follows the tear
        const k = 0.82 + grit * 0.28 + (scratch - 0.5) * 0.15;
        r = pal.spec[0] * k;
        g = pal.spec[1] * k;
        b = pal.spec[2] * k;
        a = style === "phosphor" ? 160 : style === "blackout" ? 185 : 230;
      } else if (t < 1) {
        // Bevel face: specular tip → mid face → dark under-face (fBm metal, not flat fill)
        const faceT = Math.min(1, Math.max(0, (t - 0.1) / 0.9));
        const shade = Math.pow(1 - faceT, 1.55);
        const underW = Math.pow(faceT, 0.95);
        r = pal.face[0] * (0.4 + shade * 0.7) + pal.under[0] * underW * 0.75;
        g = pal.face[1] * (0.4 + shade * 0.7) + pal.under[1] * underW * 0.75;
        b = pal.face[2] * (0.4 + shade * 0.7) + pal.under[2] * underW * 0.75;
        // Steel grain / scratches (anisotropic)
        const grain = (grit - 0.5) * 34 + (scratch - 0.5) * 28;
        r += grain;
        g += grain * 0.95;
        b += grain * 0.85;
        // Pitting — darker micro-craters
        if (pit > 0.68) {
          const dig = (pit - 0.68) * 70;
          r -= dig;
          g -= dig;
          b -= dig * 0.9;
        }
        // Sparse light rust / oxidised flecks (never yellow)
        if (style !== "phosphor" && rustN > 0.6 && grit > 0.5) {
          const rw = (rustN - 0.6) * 1.7;
          r = r * (1 - rw) + pal.rust[0] * rw;
          g = g * (1 - rw) + pal.rust[1] * rw;
          b = b * (1 - rw) + pal.rust[2] * rw;
        }
        // Specular kiss on the outer third of thicker sections
        if (faceT < 0.32 && lipH > meanH * 0.9 && scratch > 0.5) {
          r = r * 0.55 + pal.spec[0] * 0.45;
          g = g * 0.55 + pal.spec[1] * 0.45;
          b = b * 0.55 + pal.spec[2] * 0.45;
        }
        a = style === "phosphor" ? 135 + shade * 45 : 185 + shade * 45;
        if (style === "blackout") a = 200 + shade * 30;
      } else {
        // Soft AO where the lip meets the plate — into the bar only
        const aoT = Math.min(1, (dy - lipH) / aoSpan);
        const aoA = (1 - aoT) * (1 - aoT);
        r = pal.ao[0];
        g = pal.ao[1];
        b = pal.ao[2];
        a = (style === "blackout" ? 175 : 145) * aoA * (0.75 + grit * 0.35);
      }

      d[i] = Math.max(0, Math.min(255, Math.round(r)));
      d[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
      d[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
      d[i + 3] = Math.max(0, Math.min(255, Math.round(a)));
    }
  }
  ctx.putImageData(img, 0, 0);

  // Lumpy weld beads + occasional rivets along the lip (into the bar)
  const rnd = mulberry32(seed + 55);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, barW, barH);
  ctx.clip();
  let x = 18 + rnd() * 40;
  while (x < barW - 18) {
    const depth = depthAt(profile, x, barW, seed, side);
    const edgeY = side === "bottom" ? barH - depth : depth;
    const roll = rnd();
    if (roll > 0.62) {
      // Short lumpy weld seam
      const len = 14 + rnd() * 36;
      const inset = 2.2 + rnd() * 2.4;
      const y0 = edgeY + into * inset;
      ctx.strokeStyle =
        style === "rust"
          ? `rgba(70, 32, 16, ${0.4 + rnd() * 0.25})`
          : style === "red"
            ? `rgba(60, 18, 14, ${0.4 + rnd() * 0.25})`
            : style === "phosphor"
              ? `rgba(40, 60, 38, ${0.35 + rnd() * 0.2})`
              : `rgba(48, 52, 46, ${0.45 + rnd() * 0.25})`;
      ctx.lineWidth = 1.3 + rnd() * 1.4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x, y0);
      let px = x;
      while (px < x + len) {
        const step = 3 + rnd() * 4;
        px += step;
        ctx.lineTo(px, y0 + into * (rnd() - 0.5) * 2.4);
      }
      ctx.stroke();
      // Specular ridge on the bead
      if (style === "steel" || style === "blackout") {
        ctx.strokeStyle = `rgba(170, 172, 162, ${0.18 + rnd() * 0.16})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x + 1, y0 + into * 0.7);
        ctx.lineTo(x + len - 1, y0 + into * 0.7);
        ctx.stroke();
      }
      x += len + 20 + rnd() * 50;
    } else if (roll > 0.48 && style !== "phosphor") {
      // Rivet / bolt head just inside the lip
      const inset = 3.2 + rnd() * 2.2;
      const cy = edgeY + into * inset;
      const rad = 1.5 + rnd() * 1.1;
      ctx.fillStyle =
        style === "rust" || style === "red"
          ? `rgba(54, 28, 18, ${0.55 + rnd() * 0.25})`
          : `rgba(40, 44, 40, ${0.6 + rnd() * 0.25})`;
      ctx.beginPath();
      ctx.arc(x, cy, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(150, 148, 138, ${0.2 + rnd() * 0.2})`;
      ctx.beginPath();
      ctx.arc(x - rad * 0.25, cy + into * rad * 0.2, rad * 0.35, 0, Math.PI * 2);
      ctx.fill();
      x += 28 + rnd() * 70;
    } else {
      x += 16 + rnd() * 40;
    }
  }
  ctx.restore();
}

function paintSteelPlate(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number,
  quiet = false,
): void {
  const img = ctx.createImageData(w, h);
  const d = img.data;
  // quiet=true (bottom bar): lower-frequency, lower-contrast — avoids marble/oil look under wisps
  const fN = quiet ? 0.003 : 0.012;
  const fG = quiet ? 0.012 : 0.06;
  const fS = quiet ? 0.0015 : 0.004;
  const fR = quiet ? 0.006 : 0.02;
  const amp = quiet ? 0.28 : 1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const n = fbm(x * fN, y * (quiet ? 0.02 : 0.04), seed, quiet ? 3 : 5);
      const grit = fbm(x * fG, y * (quiet ? 0.04 : 0.09), seed + 11, quiet ? 2 : 3);
      const soot = fbm(x * fS, y * (quiet ? 0.012 : 0.02), seed + 23, 3);
      const rustN = fbm(x * fR, y * (quiet ? 0.015 : 0.03), seed + 41, 3);
      // Colder grey-green military steel (lets red rim + ONLINE green pop)
      let r = 11 + n * 13 * amp;
      let g = 15 + n * 17 * amp;
      let b = 14 + n * 15 * amp;
      // Grime
      r -= grit * 7 * amp;
      g -= grit * 6 * amp;
      b -= grit * 5 * amp;
      // Soot darkening toward edges / bottomish
      const edge = Math.min(x / w, 1 - x / w, y / h, 1 - y / h);
      const sootAmt = soot * (0.35 + (1 - edge) * 0.5) * (quiet ? 0.7 : 1);
      r *= 1 - sootAmt * 0.55;
      g *= 1 - sootAmt * 0.5;
      b *= 1 - sootAmt * 0.48;
      // Localized rust patches — sparse, cool-dark (not a warm beige wash)
      if (rustN > (quiet ? 0.8 : 0.72) && grit > (quiet ? 0.65 : 0.55)) {
        const k = Math.min(quiet ? 0.32 : 0.48, (rustN - 0.72) * 2.6);
        r = r * (1 - k) + (52 + grit * 14) * k;
        g = g * (1 - k) + (30 + grit * 10) * k;
        b = b * (1 - k) + (22 + grit * 6) * k;
      }
      d[i] = Math.max(0, Math.min(255, r));
      d[i + 1] = Math.max(0, Math.min(255, g));
      d[i + 2] = Math.max(0, Math.min(255, b));
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // Thin irregular scratches — mostly horizontal, short, no diagonal beams
  const rnd = mulberry32(seed + 99);
  ctx.save();
  for (let s = 0; s < 90; s++) {
    const x0 = rnd() * w;
    const y0 = rnd() * h;
    const len = 12 + rnd() * 55;
    const ang = (rnd() - 0.5) * 0.22; // near-horizontal only
    ctx.beginPath();
    ctx.strokeStyle = `rgba(${120 + rnd() * 30}, ${115 + rnd() * 25}, ${105 + rnd() * 20}, ${0.03 + rnd() * 0.07})`;
    ctx.lineWidth = 0.5 + rnd() * 0.8;
    ctx.moveTo(x0, y0);
    let x = x0;
    let y = y0;
    const steps = 5 + Math.floor(rnd() * 6);
    for (let k = 0; k < steps; k++) {
      x += Math.cos(ang + (rnd() - 0.5) * 0.2) * (len / steps);
      y += Math.sin(ang + (rnd() - 0.5) * 0.25) * (len / steps) * 0.15;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // Impact dents — soft irregular dark pits (noise-shaped, not clean circles)
  for (let h = 0; h < 8; h++) {
    const cx = rnd() * w;
    const cy = 30 + rnd() * (h - 60);
    const rad = 6 + rnd() * 14;
    const g = ctx.createRadialGradient(cx - rad * 0.2, cy - rad * 0.2, 0, cx, cy, rad);
    g.addColorStop(0, "rgba(8, 6, 5, 0.95)");
    g.addColorStop(0.45, "rgba(20, 16, 12, 0.7)");
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.beginPath();
    // Irregular poly approx
    for (let a = 0; a < Math.PI * 2; a += 0.35) {
      const rr = rad * (0.7 + fbm(Math.cos(a) * 2 + h, Math.sin(a) * 2, seed + h * 3, 2) * 0.55);
      const px = cx + Math.cos(a) * rr;
      const py = cy + Math.sin(a) * rr * 0.85;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

type RivetSpot = { x: number; y: number };

/** Split bar into dented plates with irregular weld seams + rusty rivet rows. */
function paintWeldedPlates(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number,
): RivetSpot[] {
  const rnd = mulberry32(seed + 700);
  const rivets: RivetSpot[] = [];
  const seams: number[] = [0];
  let x = 380 + rnd() * 220;
  while (x < w - 280) {
    seams.push(Math.round(x + (rnd() - 0.5) * 40));
    x += 520 + rnd() * 380;
  }
  seams.push(w);

  ctx.save();
  // Per-plate tone shift (subtle dented panels)
  for (let i = 0; i < seams.length - 1; i++) {
    const x0 = seams[i];
    const x1 = seams[i + 1];
    const tint = (rnd() - 0.5) * 10;
    ctx.fillStyle = `rgba(${18 + tint}, ${15 + tint * 0.8}, ${12 + tint * 0.5}, ${0.08 + rnd() * 0.1})`;
    ctx.beginPath();
    ctx.moveTo(x0 + 2, 2);
    for (let px = x0; px <= x1; px += 18) {
      const wobble = (fbm(px * 0.02, i * 0.4, seed + 3, 2) - 0.5) * 5;
      ctx.lineTo(px, 3 + wobble);
    }
    ctx.lineTo(x1 - 2, h - 3);
    for (let px = x1; px >= x0; px -= 18) {
      const wobble = (fbm(px * 0.02, i * 0.4 + 2, seed + 5, 2) - 0.5) * 5;
      ctx.lineTo(px, h - 3 + wobble);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Weld seams — dark irregular beads, not straight lines
  for (let i = 1; i < seams.length - 1; i++) {
    const sx = seams[i];
    ctx.beginPath();
    ctx.strokeStyle = `rgba(8, 6, 5, ${0.55 + rnd() * 0.28})`;
    ctx.lineWidth = 2.4 + rnd() * 1.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    let py = 4;
    ctx.moveTo(sx + (rnd() - 0.5) * 3, py);
    while (py < h - 4) {
      py += 6 + rnd() * 10;
      const wx = sx + (fbm(sx * 0.05, py * 0.08, seed + i, 3) - 0.5) * 7;
      ctx.lineTo(wx, Math.min(h - 4, py));
    }
    ctx.stroke();
    // Highlight bead edge
    ctx.beginPath();
    ctx.strokeStyle = `rgba(70, 62, 52, ${0.12 + rnd() * 0.1})`;
    ctx.lineWidth = 0.8;
    py = 6;
    ctx.moveTo(sx + 2, py);
    while (py < h - 6) {
      py += 8 + rnd() * 8;
      ctx.lineTo(sx + 2 + (rnd() - 0.5) * 2, Math.min(h - 6, py));
    }
    ctx.stroke();

    // Rivet rows along seam
    const step = 22 + rnd() * 10;
    for (let ry = 14 + rnd() * 8; ry < h - 14; ry += step) {
      const rx = sx + (rnd() - 0.5) * 4;
      rivets.push({ x: rx, y: ry });
      paintRivet(ctx, rx, ry, 2.6 + rnd() * 1.2, seed + Math.floor(rx + ry));
    }
  }

  // Horizontal plate join near mid (broken, not full-width)
  const midY = h * (0.38 + rnd() * 0.22);
  for (let seg = 0; seg < 5; seg++) {
    if (rnd() > 0.7) continue;
    const x0 = 80 + rnd() * (w - 200);
    const len = 140 + rnd() * 260;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(6, 5, 4, ${0.35 + rnd() * 0.2})`;
    ctx.lineWidth = 1.6 + rnd();
    let px = x0;
    ctx.moveTo(px, midY);
    while (px < x0 + len) {
      px += 8 + rnd() * 10;
      const wy = midY + (fbm(px * 0.04, midY * 0.1, seed + 40, 2) - 0.5) * 4;
      ctx.lineTo(px, wy);
    }
    ctx.stroke();
    for (let rx = x0 + 18; rx < x0 + len - 10; rx += 28 + rnd() * 12) {
      const ry = midY + (rnd() - 0.5) * 3;
      rivets.push({ x: rx, y: ry });
      paintRivet(ctx, rx, ry, 2.4 + rnd() * 1.1, seed + Math.floor(rx));
    }
  }

  // Edge bolt rows (sparse)
  for (const ey of [10 + rnd() * 4, h - 12 - rnd() * 4]) {
    for (let rx = 60 + rnd() * 40; rx < w - 40; rx += 180 + rnd() * 120) {
      // Skip centre name band on top-ish bolts
      if (rx > 1180 && rx < 2260 && ey < h * 0.55) continue;
      rivets.push({ x: rx, y: ey });
      paintRivet(ctx, rx, ey, 2.8 + rnd() * 0.8, seed + Math.floor(rx + ey * 3));
    }
  }
  ctx.restore();
  return rivets;
}

function paintRivet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  seed: number,
): void {
  const rnd = mulberry32(seed);
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, 0, x, y, r);
  g.addColorStop(0, `rgba(${90 + rnd() * 20}, ${78 + rnd() * 16}, ${62 + rnd() * 12}, 0.85)`);
  g.addColorStop(0.45, `rgba(${42 + rnd() * 12}, ${34 + rnd() * 8}, ${26}, 0.9)`);
  g.addColorStop(1, `rgba(8, 6, 5, 0.95)`);
  ctx.beginPath();
  ctx.fillStyle = g;
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  // Rust ring
  ctx.beginPath();
  ctx.strokeStyle = `rgba(${70 + rnd() * 20}, ${32 + rnd() * 10}, ${16}, ${0.25 + rnd() * 0.25})`;
  ctx.lineWidth = 0.7;
  ctx.arc(x, y, r + 0.6, 0, Math.PI * 2);
  ctx.stroke();
}

/** Rust / water stains running down from rivets & seams — clipped inside bar. */
function paintRustDrips(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rivets: RivetSpot[],
  seed: number,
): void {
  const rnd = mulberry32(seed + 880);
  const edgePad = Math.max(8, Math.round(h * 0.08));
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, edgePad * 0.3, w, h - edgePad);
  ctx.clip();

  const sample = rivets.filter((_, i) => i % 3 === 0 || rnd() > 0.55);
  for (const rv of sample) {
    if (rnd() > 0.72) continue;
    const len = 10 + rnd() * (h * 0.35);
    const maxY = Math.min(h - edgePad, rv.y + len);
    ctx.beginPath();
    ctx.strokeStyle = `rgba(${58 + rnd() * 22}, ${26 + rnd() * 10}, ${12 + rnd() * 6}, ${0.2 + rnd() * 0.2})`;
    ctx.lineWidth = 0.8 + rnd() * 1.6;
    ctx.lineCap = "round";
    let x = rv.x + (rnd() - 0.5) * 1.5;
    let y = rv.y + 2;
    ctx.moveTo(x, y);
    while (y < maxY) {
      y += 3 + rnd() * 5;
      x += (fbm(x * 0.1, y * 0.08, seed, 2) - 0.5) * 2.2;
      ctx.lineTo(x, Math.min(maxY, y));
    }
    ctx.stroke();
    // Soft stain blot at tip
    const tip = ctx.createRadialGradient(x, maxY, 0, x, maxY, 4 + rnd() * 5);
    tip.addColorStop(0, `rgba(50, 22, 12, ${0.18 + rnd() * 0.12})`);
    tip.addColorStop(1, "transparent");
    ctx.fillStyle = tip;
    ctx.fillRect(x - 8, maxY - 4, 16, 12);
  }

  // A few seam water stains (vertical washes)
  for (let i = 0; i < 7; i++) {
    const sx = 200 + rnd() * (w - 400);
    if (sx > 1250 && sx < 2200) continue; // keep name clear
    const g = ctx.createLinearGradient(sx, edgePad, sx, h - edgePad);
    g.addColorStop(0, `rgba(40, 28, 20, ${0.05 + rnd() * 0.06})`);
    g.addColorStop(0.5, `rgba(55, 30, 16, ${0.08 + rnd() * 0.06})`);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(sx - 6 - rnd() * 8, edgePad, 10 + rnd() * 14, h - edgePad * 2);
  }
  ctx.restore();
}

/** Faint raid-map etching: contour lines + grid coords scratched into steel. */
function paintMapEtching(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number,
): void {
  const rnd = mulberry32(seed + 1200);
  ctx.save();
  ctx.globalAlpha = 0.16;
  // Contour loops
  for (let c = 0; c < 9; c++) {
    const cx = 180 + rnd() * (w - 360);
    if (cx > 1300 && cx < 2150) continue;
    const cy = h * (0.25 + rnd() * 0.5);
    const rx = 40 + rnd() * 90;
    const ry = 12 + rnd() * 28;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(${150 + rnd() * 30}, ${140 + rnd() * 25}, ${120}, 0.55)`;
    ctx.lineWidth = 0.55;
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.18) {
      const warp = 0.85 + fbm(Math.cos(a) * 3 + c, Math.sin(a) * 3, seed + c, 2) * 0.35;
      const px = cx + Math.cos(a) * rx * warp;
      const py = cy + Math.sin(a) * ry * warp;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  // Sparse grid ticks
  ctx.strokeStyle = "rgba(160, 150, 130, 0.35)";
  ctx.lineWidth = 0.4;
  for (let gx = 120; gx < w; gx += 280 + Math.floor(rnd() * 80)) {
    if (gx > 1280 && gx < 2180) continue;
    ctx.beginPath();
    ctx.moveTo(gx, h * 0.12);
    ctx.lineTo(gx, h * 0.88);
    ctx.stroke();
  }
  // Coordinate glyphs (scratched, not clean type)
  ctx.font = `${Math.max(8, Math.round(h * 0.055))}px "Share Tech Mono", monospace`;
  ctx.fillStyle = "rgba(170, 160, 140, 0.45)";
  const labels = ["A-04", "B-12", "C-07", "D-19", "GRID 3", "N48", "E-22"];
  for (let i = 0; i < 5; i++) {
    const lx = 100 + rnd() * (w - 200);
    if (lx > 1200 && lx < 2240) continue;
    const ly = h * (0.18 + rnd() * 0.6);
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate((rnd() - 0.5) * 0.12);
    ctx.globalAlpha = 0.08 + rnd() * 0.08;
    ctx.fillText(labels[Math.floor(rnd() * labels.length)], 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

/** Faded stencil marks — sector / tally / arrows / skull. Avoid HUD bands. */
function paintSprayStencils(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number,
  quiet: boolean,
): void {
  const rnd = mulberry32(seed + 1500);
  const safeX = (x: number, pad = 160) => x < 1180 - pad || x > 2260 + pad;
  const places: Array<{ x: number; y: number }> = [];
  const candidates = quiet
    ? [
        { x: 480, y: h * 0.42 },
        { x: 1600, y: h * 0.35 },
        { x: 2450, y: h * 0.48 },
        { x: 3100, y: h * 0.4 },
        { x: 980, y: h * 0.55 },
      ]
    : [
        { x: 560, y: h * 0.55 },
        { x: 980, y: h * 0.38 },
        { x: 2480, y: h * 0.42 },
        { x: 3050, y: h * 0.5 },
        { x: 180, y: h * 0.45 },
      ];
  for (const p of candidates) {
    if (safeX(p.x)) places.push(p);
  }

  const erodeStamp = (
    draw: () => void,
    ox: number,
    oy: number,
    color: string,
    alpha: number,
  ) => {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate((rnd() - 0.5) * 0.15);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    draw();
    // Noise erase for eroded look
    ctx.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 40; i++) {
      const ex = (rnd() - 0.5) * 90;
      const ey = (rnd() - 0.5) * 70;
      if (fbm(ex * 0.1, ey * 0.1, seed + i, 2) < 0.42) {
        ctx.beginPath();
        ctx.arc(ex, ey, 1 + rnd() * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fill();
      }
    }
    ctx.restore();
  };

  // Sector number
  if (places[0]) {
    erodeStamp(
      () => {
        ctx.font = `bold ${Math.round(h * 0.28)}px "Oswald", Impact, sans-serif`;
        ctx.fillText("S-" + (3 + Math.floor(rnd() * 6)), -28, 10);
      },
      places[0].x,
      places[0].y,
      rnd() > 0.45 ? "rgba(210, 205, 190, 1)" : "rgba(120, 36, 28, 1)",
      0.2 + rnd() * 0.08,
    );
  }

  // Kill tally chalk marks
  if (places[1]) {
    erodeStamp(
      () => {
        ctx.lineWidth = 1.8;
        ctx.lineCap = "round";
        for (let t = 0; t < 4; t++) {
          ctx.beginPath();
          ctx.moveTo(t * 9 - 16, -10);
          ctx.lineTo(t * 9 - 12, 12);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(-18, -4);
        ctx.lineTo(20, 8);
        ctx.stroke();
      },
      places[1].x,
      places[1].y,
      "rgba(200, 195, 180, 1)",
      0.18 + rnd() * 0.08,
    );
  }

  // Warning arrows
  if (places[2]) {
    erodeStamp(
      () => {
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.lineTo(14, 0);
        ctx.lineTo(6, -8);
        ctx.moveTo(14, 0);
        ctx.lineTo(6, 8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-10, 16);
        ctx.lineTo(10, 16);
        ctx.lineTo(4, 10);
        ctx.moveTo(10, 16);
        ctx.lineTo(4, 22);
        ctx.stroke();
      },
      places[2].x,
      places[2].y,
      "rgba(110, 34, 26, 1)",
      0.18 + rnd() * 0.08,
    );
  }

  // Skull stencil
  if (places[3]) {
    erodeStamp(
      () => {
        ctx.beginPath();
        ctx.ellipse(0, -2, 14, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.ellipse(-5, -3, 3.2, 3.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(5, -3, 3.2, 3.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.fillRect(-2, 6, 4, 5);
        ctx.fillRect(-7, 10, 4, 3);
        ctx.fillRect(3, 10, 4, 3);
      },
      places[3].x,
      places[3].y,
      "rgba(200, 195, 185, 1)",
      0.16 + rnd() * 0.07,
    );
  }
}

/** Reduced corner blood — ~half coverage/opacity vs original. */
function paintBloodSplatter(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number,
  corner: "tl" | "tr" | "bl" | "br",
): void {
  ctx.clearRect(0, 0, w, h);
  const rnd = mulberry32(seed);
  const ox = corner.includes("r") ? w : 0;
  const oy = corner.includes("b") ? h : 0;
  const dirX = corner.includes("r") ? -1 : 1;
  const dirY = corner.includes("b") ? -1 : 1;

  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const lx = corner.includes("r") ? w - x : x;
      const ly = corner.includes("b") ? h - y : y;
      // Tighter falloff → less coverage
      const dist = Math.hypot(lx * 1.25, ly * 1.15) / Math.hypot(w * 0.72, h * 0.72);
      const n = fbm(x * 0.07, y * 0.07, seed, 5);
      const spray = fbm(x * 0.18, y * 0.18, seed + 19, 2);
      const fall = Math.max(0, 1 - dist * 1.55);
      let a = 0;
      if (fall > 0.28 && n > 0.66 && spray > 0.5) a = (n - 0.66) * fall * 2.2;
      if (fall > 0.55 && n > 0.58) a = Math.max(a, (n - 0.58) * fall * 0.9);
      if (a <= 0.08) continue;
      const i = (y * w + x) * 4;
      const rust = spray > 0.65;
      d[i] = rust ? 72 : 95;
      d[i + 1] = rust ? 30 : 18;
      d[i + 2] = rust ? 14 : 12;
      d[i + 3] = Math.min(120, a * 140); // ~half opacity
    }
  }
  ctx.putImageData(img, 0, 0);

  ctx.save();
  for (let drop = 0; drop < 28; drop++) {
    const reach = rnd();
    const cx = ox + dirX * (4 + rnd() * w * (0.08 + reach * 0.45));
    const cy = oy + dirY * (4 + rnd() * h * (0.08 + reach * 0.4));
    const radX = 1 + rnd() * (reach < 0.35 ? 10 : 3.2);
    const radY = radX * (0.35 + rnd() * 0.85);
    ctx.beginPath();
    const verts = 7 + Math.floor(rnd() * 5);
    for (let v = 0; v < verts; v++) {
      const a = (v / verts) * Math.PI * 2 + rnd() * 0.2;
      const warp = 0.35 + fbm(cx * 0.08 + Math.cos(a) * 2, cy * 0.08 + Math.sin(a) * 2, seed + drop, 3);
      const px = cx + Math.cos(a) * radX * warp;
      const py = cy + Math.sin(a) * radY * warp;
      if (v === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = `rgba(${50 + rnd() * 35}, ${10 + rnd() * 12}, ${8 + rnd() * 8}, ${0.28 + rnd() * 0.22})`;
    ctx.fill();
  }

  for (let drip = 0; drip < 6; drip++) {
    const x = ox + dirX * (12 + rnd() * w * 0.35);
    const y0 = oy + dirY * (6 + rnd() * 28);
    const len = 14 + rnd() * 40;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(${50 + rnd() * 28}, 12, 9, ${0.22 + rnd() * 0.22})`;
    ctx.lineWidth = 0.6 + rnd() * 1.4;
    ctx.lineCap = "round";
    let y = y0;
    let xw = x;
    ctx.moveTo(xw, y);
    const steps = 5 + Math.floor(rnd() * 4);
    for (let s = 0; s < steps; s++) {
      y += dirY * (len / steps);
      xw += (rnd() - 0.5) * 3;
      ctx.lineTo(xw, y);
    }
    ctx.stroke();
  }

  for (let c = 0; c < 4; c++) {
    let x = ox + dirX * (3 + rnd() * 22);
    let y = oy + dirY * (3 + rnd() * 18);
    ctx.beginPath();
    ctx.strokeStyle = `rgba(40, 10, 8, ${0.28 + rnd() * 0.22})`;
    ctx.lineWidth = 0.7 + rnd() * 1.1;
    ctx.moveTo(x, y);
    const segs = 6 + Math.floor(rnd() * 6);
    for (let s = 0; s < segs; s++) {
      x += dirX * (4 + rnd() * 10) + (rnd() - 0.5) * 7;
      y += dirY * (2 + rnd() * 8) + (rnd() - 0.5) * 5;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Realistic static bullet hole: dark puncture, outward-bent metal petals,
 * radial micro-cracks, scorch + paint chip, rim highlight.
 * Drawn in local space around (0,0) then transformed — rotDeg varies silhouette.
 */
function paintBulletHole(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  seed: number,
  scale = 1,
  rotDeg = 0,
): void {
  const rnd = mulberry32(seed);
  const holeR = (4.2 + rnd() * 3.8) * scale;
  const petalR = holeR * (1.85 + rnd() * 0.85);
  const petalCount = 5 + Math.floor(rnd() * 5);
  const crackCount = 5 + Math.floor(rnd() * 8);
  const chipCount = 8 + Math.floor(rnd() * 12);
  const squash = 0.78 + rnd() * 0.4; // elliptical impact

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotDeg * Math.PI) / 180);
  ctx.scale(1, squash);

  // Scorch / paint chip ring
  const scorch = ctx.createRadialGradient(0, 0, holeR * 0.6, 0, 0, petalR * 1.55);
  scorch.addColorStop(0, "rgba(8, 6, 5, 0.55)");
  scorch.addColorStop(0.35, "rgba(42, 28, 18, 0.4)");
  scorch.addColorStop(0.65, "rgba(70, 48, 28, 0.18)");
  scorch.addColorStop(1, "transparent");
  ctx.fillStyle = scorch;
  ctx.beginPath();
  ctx.arc(0, 0, petalR * 1.55, 0, Math.PI * 2);
  ctx.fill();

  // Paint chips (irregular flakes around rim)
  for (let i = 0; i < chipCount; i++) {
    const ang = rnd() * Math.PI * 2;
    const dist = holeR * (1.1 + rnd() * 1.6);
    const px = Math.cos(ang) * dist;
    const py = Math.sin(ang) * dist * 0.9;
    const rw = 1.2 + rnd() * 3.5;
    const rh = 0.8 + rnd() * 2.2;
    ctx.beginPath();
    for (let v = 0; v < 6; v++) {
      const a = ang + (v / 6) * Math.PI * 2;
      const rr = (v % 2 === 0 ? rw : rh) * (0.7 + fbm(px * 0.1 + v, py * 0.1, seed + i, 2));
      const qx = px + Math.cos(a) * rr;
      const qy = py + Math.sin(a) * rr;
      if (v === 0) ctx.moveTo(qx, qy);
      else ctx.lineTo(qx, qy);
    }
    ctx.closePath();
    ctx.fillStyle = `rgba(${18 + rnd() * 22}, ${14 + rnd() * 14}, ${10 + rnd() * 10}, ${0.45 + rnd() * 0.35})`;
    ctx.fill();
  }

  // Outward-bent metal petals
  for (let p = 0; p < petalCount; p++) {
    const ang = (p / petalCount) * Math.PI * 2 + (rnd() - 0.5) * 0.55;
    const len = petalR * (0.65 + rnd() * 0.6);
    const spread = 0.22 + rnd() * 0.32;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang - spread) * holeR * 0.85, Math.sin(ang - spread) * holeR * 0.85);
    const mid = len * (0.55 + rnd() * 0.25);
    const tipX = Math.cos(ang) * len;
    const tipY = Math.sin(ang) * len + (rnd() - 0.5) * 2;
    const c1x = Math.cos(ang - spread * 0.4) * mid;
    const c1y = Math.sin(ang - spread * 0.4) * mid - 1.5 * scale;
    ctx.quadraticCurveTo(c1x, c1y, tipX, tipY);
    ctx.quadraticCurveTo(
      Math.cos(ang + spread * 0.4) * mid,
      Math.sin(ang + spread * 0.4) * mid - 1.2 * scale,
      Math.cos(ang + spread) * holeR * 0.85,
      Math.sin(ang + spread) * holeR * 0.85,
    );
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, tipX, tipY);
    g.addColorStop(0, "rgba(12, 10, 8, 0.95)");
    g.addColorStop(0.45, `rgba(${55 + rnd() * 25}, ${48 + rnd() * 18}, ${40 + rnd() * 14}, 0.85)`);
    g.addColorStop(1, `rgba(${28 + rnd() * 16}, ${24 + rnd() * 12}, ${20 + rnd() * 10}, 0.7)`);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = `rgba(${140 + rnd() * 40}, ${130 + rnd() * 30}, ${110 + rnd() * 25}, ${0.22 + rnd() * 0.2})`;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }

  // Radial micro-cracks
  for (let k = 0; k < crackCount; k++) {
    const ang = rnd() * Math.PI * 2;
    let x = Math.cos(ang) * holeR * 0.9;
    let y = Math.sin(ang) * holeR * 0.9;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(6, 5, 4, ${0.35 + rnd() * 0.35})`;
    ctx.lineWidth = 0.45 + rnd() * 0.55;
    ctx.moveTo(x, y);
    const segs = 3 + Math.floor(rnd() * 5);
    for (let s = 0; s < segs; s++) {
      x += Math.cos(ang + (rnd() - 0.5) * 0.5) * (3 + rnd() * 7) * scale;
      y += Math.sin(ang + (rnd() - 0.5) * 0.5) * (3 + rnd() * 7) * scale;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Dark puncture core
  const core = ctx.createRadialGradient(-holeR * 0.2, -holeR * 0.25, 0, 0, 0, holeR);
  core.addColorStop(0, "rgba(0, 0, 0, 1)");
  core.addColorStop(0.55, "rgba(6, 5, 4, 0.98)");
  core.addColorStop(0.85, "rgba(18, 14, 10, 0.9)");
  core.addColorStop(1, "rgba(40, 32, 24, 0.55)");
  ctx.beginPath();
  ctx.fillStyle = core;
  for (let a = 0; a < Math.PI * 2; a += 0.4) {
    const rr = holeR * (0.85 + fbm(Math.cos(a) * 3 + seed, Math.sin(a) * 3, seed, 2) * 0.28);
    const px = Math.cos(a) * rr;
    const py = Math.sin(a) * rr * 0.92;
    if (a === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Specular edge highlight (lit rim)
  ctx.beginPath();
  ctx.strokeStyle = "rgba(190, 180, 155, 0.35)";
  ctx.lineWidth = 1.1;
  ctx.arc(-holeR * 0.15, -holeR * 0.2, holeR * 0.95, -2.4, -0.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = "rgba(40, 36, 30, 0.55)";
  ctx.lineWidth = 1;
  ctx.arc(holeR * 0.1, holeR * 0.15, holeR * 0.9, 0.5, 2.6);
  ctx.stroke();

  ctx.restore();
}

function buildNameErosionMask(w: number, h: number, seed: number): string {
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = fbm(x * 0.08, y * 0.12, seed, 4);
      const chip = fbm(x * 0.2, y * 0.25, seed + 9, 2);
      // Mostly opaque; punch irregular holes / edge erosion
      let a = 255;
      if (n > 0.72 && chip > 0.55) a = 0;
      else if (n > 0.65) a = Math.floor(180 + n * 40);
      // Edge soft chips
      const edge = Math.min(x / w, 1 - x / w, y / h, 1 - y / h);
      if (edge < 0.08 && chip > 0.5) a = Math.min(a, Math.floor(edge * 12 * 255));
      const i = (y * w + x) * 4;
      d[i] = d[i + 1] = d[i + 2] = 255;
      d[i + 3] = a;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL("image/png");
}

function ensureLayer(parent: HTMLElement, className: string): HTMLCanvasElement {
  let el = parent.querySelector(`canvas.${className}`) as HTMLCanvasElement | null;
  if (!el) {
    el = document.createElement("canvas");
    el.className = className;
    el.setAttribute("aria-hidden", "true");
    parent.appendChild(el);
  }
  return el;
}

/** Barbed wire / bent rebar along torn edge — stays inside the bar. */
function paintEdgeWire(
  ctx: CanvasRenderingContext2D,
  profile: Float32Array,
  barW: number,
  barH: number,
  side: EdgeSide,
  seed: number,
  style: SmokeEdgeStyle = "red",
): void {
  const rnd = mulberry32(seed + 2200);
  const emphasize = style === "blackout";
  // Sit wire just inside the beveled lip (into the bar, never into the stage)
  const wireInset = emphasize ? 8 : 6.5;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, barW, barH);
  ctx.clip();
  const samples = emphasize ? 64 : 48;
  // Bent rebar strand
  ctx.beginPath();
  ctx.strokeStyle = emphasize ? "rgba(38, 40, 36, 0.9)" : "rgba(28, 30, 28, 0.75)";
  ctx.lineWidth = emphasize ? 2.8 : 2.2;
  ctx.lineCap = "round";
  for (let i = 0; i <= samples; i++) {
    const x = (i / samples) * barW;
    const depth = depthAt(profile, x, barW, seed);
    const y =
      side === "bottom"
        ? barH - depth - wireInset - (fbm(x * 0.01, 1, seed, 2) - 0.5) * 4
        : depth + wireInset + (fbm(x * 0.01, 2, seed, 2) - 0.5) * 4;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Sparse barbs (denser for blackout — wire carries the edge detail)
  const step = emphasize ? 1 : 2;
  for (let i = 2; i < samples; i += step + Math.floor(rnd() * 2)) {
    const x = (i / samples) * barW;
    if (x > 1300 && x < 2140) continue; // keep clear of name / centre
    const depth = depthAt(profile, x, barW, seed);
    const y =
      side === "bottom" ? barH - depth - wireInset : depth + wireInset;
    const dir = side === "bottom" ? -1 : 1;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(36, 38, 34, ${emphasize ? 0.65 + rnd() * 0.25 : 0.45 + rnd() * 0.3})`;
    ctx.lineWidth = emphasize ? 1.35 : 1.1;
    ctx.moveTo(x - 4, y);
    ctx.lineTo(x + 1, y + dir * (5 + rnd() * 4));
    ctx.moveTo(x + 4, y);
    ctx.lineTo(x - 1, y + dir * (5 + rnd() * 4));
    ctx.stroke();
  }
  ctx.restore();
}

/** Torn tape + faded paper notice on open steel. */
function paintTapeAndPaper(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number,
  quiet: boolean,
): void {
  const rnd = mulberry32(seed + 2400);
  ctx.save();
  // Masking-tape scraps
  const tapes = quiet
    ? [
        { x: 1320, y: h * 0.28, rot: -0.12, w: 70, h: 16 },
        { x: 2680, y: h * 0.5, rot: 0.18, w: 58, h: 14 },
      ]
    : [
        { x: 780, y: h * 0.62, rot: -0.2, w: 64, h: 15 },
        { x: 2520, y: h * 0.22, rot: 0.14, w: 72, h: 14 },
      ];
  for (const t of tapes) {
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.rot);
    ctx.fillStyle = `rgba(${150 + rnd() * 20}, ${138 + rnd() * 16}, ${100}, ${0.22 + rnd() * 0.12})`;
    ctx.beginPath();
    ctx.moveTo(-t.w / 2, -t.h / 2);
    ctx.lineTo(t.w / 2, -t.h / 2 + rnd() * 2);
    ctx.lineTo(t.w / 2 - 2, t.h / 2);
    ctx.lineTo(-t.w / 2 + 3, t.h / 2 - rnd());
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // Ripped paper notice
  const px = quiet ? 2100 : 1100;
  const py = h * (quiet ? 0.32 : 0.58);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(quiet ? 0.08 : -0.1);
  ctx.fillStyle = "rgba(170, 162, 140, 0.16)";
  ctx.beginPath();
  ctx.moveTo(-38, -16);
  ctx.lineTo(40, -14);
  ctx.lineTo(36, 18);
  ctx.lineTo(-32, 20);
  ctx.lineTo(-40, 2);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "rgba(90, 28, 22, 0.85)";
  ctx.font = `bold ${Math.max(8, Math.round(h * 0.07))}px "Share Tech Mono", monospace`;
  ctx.fillText("RESTRICTED", -34, 0);
  ctx.fillText("AREA", -16, 12);
  ctx.restore();
  ctx.restore();
}

/** Brass shell casings along bottom bar — catch a cool glint, not yellow flare. */
function paintShellCasings(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number,
): void {
  const rnd = mulberry32(seed + 2600);
  const spots = [
    { x: 420, y: h * 0.72 },
    { x: 980, y: h * 0.68 },
    { x: 1880, y: h * 0.74 },
    { x: 2560, y: h * 0.7 },
    { x: 3180, y: h * 0.66 },
  ];
  ctx.save();
  for (const s of spots) {
    if (rnd() > 0.85) continue;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate((rnd() - 0.5) * 1.2);
    const len = 9 + rnd() * 5;
    const g = ctx.createLinearGradient(-len / 2, 0, len / 2, 0);
    g.addColorStop(0, "rgba(48, 46, 38, 0.85)");
    g.addColorStop(0.45, "rgba(118, 116, 100, 0.7)");
    g.addColorStop(0.55, "rgba(168, 166, 150, 0.45)"); // cool glint, not yellow
    g.addColorStop(1, "rgba(40, 38, 32, 0.85)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, len / 2, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(20, 18, 14, 0.5)";
    ctx.lineWidth = 0.6;
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function resolveSmokeBarPx(stage: HTMLElement, top: HTMLElement): number {
  const fromBox = Math.round(top.getBoundingClientRect().height || 0);
  const fromCss = Number.parseFloat(
    getComputedStyle(stage).getPropertyValue("--uw-bar-h") || "",
  );
  const fromData = Number.parseFloat(stage.dataset.barH || "");
  const h = fromBox || (Number.isFinite(fromCss) ? Math.round(fromCss) : 0) || fromData || 180;
  return Math.max(120, Math.min(248, Math.round(h)));
}

export function applySmokeRuinTextures(stage: HTMLElement): () => void {
  const top = stage.querySelector("#uw-top") as HTMLElement | null;
  const bot = stage.querySelector("#uw-bottom") as HTMLElement | null;
  if (!top || !bot) return () => {};

  const BAR_W = 3440;
  const DESIGN_H = 248;
  const BAR_H = resolveSmokeBarPx(stage, top);
  const yScale = BAR_H / DESIGN_H;
  const holeScaleMul = Math.max(0.72, Math.min(1.1, yScale));
  const tornDepth = Math.max(6, Math.round(10 * yScale));
  const edgeStyleEarly = resolveSmokeEdgeStyle(stage);
  const lipClear = smokeEdgeClearPx(tornDepth, edgeStyleEarly);
  stage.style.setProperty("--smk-lip-clear", `${lipClear}px`);
  stage.dataset.edge = edgeStyleEarly;

  // --- Steel plates + fixed static bullet holes (open steel only — clear of UI) ---
  // Design coords are for 248px bars; y/scale remap with current --uw-bar-h.
  // Top gaps: left of name (~700–1150), right of name/OP (~2250–2750). Avoid clocks/plates.
  type Hole = { x: number; y: number; seed: number; scale: number; rot: number };
  const topHoles: Hole[] = [
    { x: 2380, y: 105, seed: 4401, scale: 1.1, rot: 14 },
    { x: 920, y: 68, seed: 4403, scale: 0.78, rot: -31 },
    { x: 2588, y: 162, seed: 4404, scale: 1.28, rot: 47 },
  ];
  const botHoles: Hole[] = [
    { x: 1100, y: 95, seed: 4402, scale: 1.05, rot: -11 },
    { x: 690, y: 142, seed: 4405, scale: 0.72, rot: 58 },
    { x: 2910, y: 74, seed: 4406, scale: 1.18, rot: -39 },
  ];
  for (const [bar, seed, quiet, holes] of [
    [top, 101, false, topHoles] as const,
    [bot, 202, true, botHoles] as const,
  ]) {
    const steelHost = bar.querySelector(".smk-steel") as HTMLElement | null;
    if (!steelHost) continue;
    steelHost.innerHTML = "";
    const c = ensureLayer(steelHost, "smk-steel-canvas");
    c.width = BAR_W;
    c.height = BAR_H;
    const ctx = c.getContext("2d")!;
    paintSteelPlate(ctx, BAR_W, BAR_H, seed, quiet);
    const rivets = paintWeldedPlates(ctx, BAR_W, BAR_H, seed);
    paintMapEtching(ctx, BAR_W, BAR_H, seed + 17);
    paintSprayStencils(ctx, BAR_W, BAR_H, seed + 31, quiet);
    paintRustDrips(ctx, BAR_W, BAR_H, rivets, seed + 53);
    paintTapeAndPaper(ctx, BAR_W, BAR_H, seed + 71, quiet);
    if (quiet) paintShellCasings(ctx, BAR_W, BAR_H, seed + 91);
    for (const h of holes) {
      const yy = Math.round(h.y * yScale);
      // Keep cores away from torn grit (~8% edges) and chatter band on bottom
      const yClamped = Math.max(
        Math.round(BAR_H * 0.12),
        Math.min(Math.round(BAR_H * 0.78), yy),
      );
      paintBulletHole(ctx, h.x, yClamped, h.seed, h.scale * holeScaleMul, h.rot);
    }
  }

  // --- Shallow consistent torn edges (small grit only; plates stay inside bar) ---
  const topProfile = buildTornProfile(BAR_W, tornDepth, 404);
  const botProfile = buildTornProfile(BAR_W, tornDepth, 808);

  for (const [bar, profile, side, seed] of [
    [top, topProfile, "bottom", 501] as const,
    [bot, botProfile, "top", 502] as const,
  ]) {
    bar.style.clipPath = "none";
    (bar.style as CSSStyleDeclaration & { webkitClipPath?: string }).webkitClipPath = "none";
    const maskUrl = buildTornMask(BAR_W, BAR_H, profile, side, seed);
    bar.style.webkitMaskImage = `url(${maskUrl})`;
    bar.style.maskImage = `url(${maskUrl})`;
    bar.style.webkitMaskSize = "100% 100%";
    bar.style.maskSize = "100% 100%";
    bar.style.webkitMaskRepeat = "no-repeat";
    bar.style.maskRepeat = "no-repeat";

    bar.querySelectorAll(".smk-edge-stack").forEach((el) => {
      (el as HTMLElement).style.display = "none";
    });
    const edgeHost =
      (bar.querySelector(".smk-torn-canvas-host") as HTMLElement | null) ||
      (() => {
        const d = document.createElement("div");
        d.className = "smk-torn-canvas-host";
        d.setAttribute("aria-hidden", "true");
        bar.appendChild(d);
        return d;
      })();
    const c = ensureLayer(edgeHost, "smk-torn-canvas");
    c.width = BAR_W;
    c.height = BAR_H;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, BAR_W, BAR_H);
    const edgeStyle = resolveSmokeEdgeStyle(stage);
    stage.dataset.edge = edgeStyle;
    edgeHost.dataset.edge = edgeStyle;
    edgeHost.classList.toggle("smk-edge-phosphor", edgeStyle === "phosphor");
    drawTornRustStrip(ctx, profile, BAR_W, BAR_H, side, seed, edgeStyle);
    paintEdgeWire(ctx, profile, BAR_W, BAR_H, side, seed, edgeStyle);
  }

  // Smoke / haze / wisp layers removed — user choosing next FX options

  // --- Corner blood: keep a hint on 2 corners only (tl + br), reduced ---
  const keepBlood = new Set(["tl", "br"]);
  const corners: Array<["tl" | "tr" | "bl" | "br", HTMLElement, number]> = [];
  top.querySelectorAll(".smk-corner-blood").forEach((el, i) => {
    const corner = el.classList.contains("tr") ? "tr" : "tl";
    corners.push([corner, el as HTMLElement, 900 + i]);
  });
  bot.querySelectorAll(".smk-corner-blood").forEach((el, i) => {
    const corner = el.classList.contains("br") ? "br" : "bl";
    corners.push([corner, el as HTMLElement, 920 + i]);
  });
  for (const [corner, host, seed] of corners) {
    host.innerHTML = "";
    if (!keepBlood.has(corner)) {
      host.style.display = "none";
      continue;
    }
    host.style.display = "";
    host.classList.add("smk-blood-soft");
    const c = ensureLayer(host, "smk-blood-canvas");
    const bw = Math.round(280 * Math.max(0.7, yScale));
    const bh = Math.round(150 * Math.max(0.7, yScale));
    c.width = bw;
    c.height = bh;
    paintBloodSplatter(c.getContext("2d")!, bw, bh, seed, corner);
  }

  // --- Name erosion + spray overspray + short drips + helmet silhouette ---
  const nameFace = stage.querySelector(".smk-name-face") as HTMLElement | null;
  const nameplate = stage.querySelector(".smk-nameplate") as HTMLElement | null;
  if (nameFace && nameplate) {
    const mask = buildNameErosionMask(900, 160, 1201);
    nameFace.style.webkitMaskImage = `url(${mask})`;
    nameFace.style.maskImage = `url(${mask})`;
    nameFace.style.webkitMaskSize = "100% 100%";
    nameFace.style.maskSize = "100% 100%";
    nameFace.style.webkitMaskRepeat = "no-repeat";
    nameFace.style.maskRepeat = "no-repeat";

    let helm = nameplate.querySelector(".smk-helm-sil") as HTMLElement | null;
    if (!helm) {
      helm = document.createElement("span");
      helm.className = "smk-helm-sil";
      helm.setAttribute("aria-hidden", "true");
      nameplate.insertBefore(helm, nameFace);
    }

    let spray = nameplate.querySelector("canvas.smk-spray-canvas") as HTMLCanvasElement | null;
    if (!spray) {
      spray = document.createElement("canvas");
      spray.className = "smk-spray-canvas";
      spray.setAttribute("aria-hidden", "true");
      nameplate.insertBefore(spray, nameFace);
    }
    spray.width = 980;
    spray.height = 200;
    const sctx = spray.getContext("2d")!;
    sctx.clearRect(0, 0, 980, 200);
    const rnd = mulberry32(1300);
    // Soft overspray cloud
    for (let i = 0; i < 1400; i++) {
      const x = 30 + rnd() * 920;
      const y = 18 + rnd() * 150;
      const n = fbm(x * 0.05, y * 0.05, 1301, 2);
      if (n < 0.48) continue;
      sctx.fillStyle = `rgba(215, 208, 190, ${0.02 + rnd() * 0.05})`;
      sctx.fillRect(x, y, 1 + rnd() * 2.5, 1 + rnd() * 2);
    }
    // Short paint drips (stay inside nameplate / bar)
    sctx.lineCap = "round";
    for (let d = 0; d < 9; d++) {
      const x = 120 + rnd() * 740;
      const y0 = 95 + rnd() * 35;
      const len = 8 + rnd() * 18;
      sctx.beginPath();
      sctx.strokeStyle = `rgba(200, 194, 178, ${0.1 + rnd() * 0.12})`;
      sctx.lineWidth = 1 + rnd() * 1.6;
      let xw = x;
      let y = y0;
      sctx.moveTo(xw, y);
      while (y < y0 + len && y < 188) {
        y += 2 + rnd() * 3;
        xw += (rnd() - 0.5) * 1.2;
        sctx.lineTo(xw, y);
      }
      sctx.stroke();
    }
  }

  // Hide obsolete geometric / smoke layers
  stage
    .querySelectorAll(
      ".smk-scratches, .smk-peel, .smk-grime, .smk-soot, .smk-impacts, .smk-wire, .smk-rivets, .smk-wisps, .smk-gloom-smoke, .uw-smoke-wisp, .uw-bar-haze, .uw-smoke-depth, .uw-header-drift, .uw-footer-drift",
    )
    .forEach((el) => {
      (el as HTMLElement).style.display = "none";
    });
  stage.querySelectorAll(".smk-name-distress, .smk-name-overspray, .smk-name-drips").forEach((el) => {
    (el as HTMLElement).style.display = "none";
  });

  return () => {};
}
