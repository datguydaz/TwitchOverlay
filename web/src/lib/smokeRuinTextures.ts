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

function drawTornRustStrip(
  ctx: CanvasRenderingContext2D,
  profile: Float32Array,
  barW: number,
  barH: number,
  side: EdgeSide,
  seed: number,
): void {
  const stripH = 5;
  const img = ctx.createImageData(barW, barH);
  const d = img.data;
  for (let x = 0; x < barW; x++) {
    const depth = depthAt(profile, x, barW, seed, side);
    const edgeY = side === "bottom" ? barH - depth : depth;
    for (let dy = 0; dy < stripH + 4; dy++) {
      const y =
        side === "bottom"
          ? Math.floor(edgeY - 1 - dy)
          : Math.floor(edgeY + 1 + dy);
      if (y < 0 || y >= barH) continue;
      const rustN = fbm(x * 0.05, dy * 0.4, seed + 3, 3);
      const i = (y * barW + x) * 4;
      const fade = 1 - dy / (stripH + 4);
      if (dy <= 1) {
        // dark-red warn hairline along the break
        d[i] = 120;
        d[i + 1] = 28;
        d[i + 2] = 18;
        d[i + 3] = Math.floor(200 * fade);
      } else {
        d[i] = 48 + rustN * 40;
        d[i + 1] = 24 + rustN * 14;
        d[i + 2] = 12 + rustN * 6;
        d[i + 3] = Math.floor((160 + rustN * 60) * fade);
      }
    }
    // Sparse hazard flecks (not a repeating stripe tile)
    if (hash2(x, seed, seed + 9) > 0.92) {
      const y =
        side === "bottom"
          ? Math.floor(edgeY - 3 - hash2(x, 1, seed) * 3)
          : Math.floor(edgeY + 3 + hash2(x, 1, seed) * 3);
      if (y >= 0 && y < barH) {
        const i = (y * barW + x) * 4;
        d[i] = 90;
        d[i + 1] = 22;
        d[i + 2] = 14;
        d[i + 3] = 140;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
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
      // Base steel charcoal
      let r = 16 + n * 18 * amp;
      let g = 14 + n * 15 * amp;
      let b = 12 + n * 12 * amp;
      // Grime
      r -= grit * 8 * amp;
      g -= grit * 7 * amp;
      b -= grit * 6 * amp;
      // Soot darkening toward edges / bottomish
      const edge = Math.min(x / w, 1 - x / w, y / h, 1 - y / h);
      const sootAmt = soot * (0.35 + (1 - edge) * 0.5) * (quiet ? 0.7 : 1);
      r *= 1 - sootAmt * 0.55;
      g *= 1 - sootAmt * 0.55;
      b *= 1 - sootAmt * 0.55;
      // Localized rust patches — sparse, cool-dark (not a warm beige wash)
      if (rustN > (quiet ? 0.8 : 0.72) && grit > (quiet ? 0.65 : 0.55)) {
        const k = Math.min(quiet ? 0.35 : 0.55, (rustN - 0.72) * 2.8);
        r = r * (1 - k) + (58 + grit * 18) * k;
        g = g * (1 - k) + (28 + grit * 8) * k;
        b = b * (1 - k) + (16 + grit * 4) * k;
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

  // Sparse noise spray (thresholded) + rust bleed — no soft round wash
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const lx = corner.includes("r") ? w - x : x;
      const ly = corner.includes("b") ? h - y : y;
      const dist = Math.hypot(lx * 1.1, ly) / Math.hypot(w, h);
      const n = fbm(x * 0.07, y * 0.07, seed, 5);
      const spray = fbm(x * 0.18, y * 0.18, seed + 19, 2);
      const fall = Math.max(0, 1 - dist * 1.35);
      // Hard speckles, not a filled blob
      let a = 0;
      if (fall > 0.15 && n > 0.58 && spray > 0.42) a = (n - 0.58) * fall * 3.2;
      if (fall > 0.45 && n > 0.48) a = Math.max(a, (n - 0.48) * fall * 1.4);
      if (a <= 0.05) continue;
      const i = (y * w + x) * 4;
      const rust = spray > 0.6;
      d[i] = rust ? 78 : 105;
      d[i + 1] = rust ? 34 : 20;
      d[i + 2] = rust ? 16 : 14;
      d[i + 3] = Math.min(235, a * 255);
    }
  }
  ctx.putImageData(img, 0, 0);

  ctx.save();
  // Irregular droplet islands (noise-warped, elongated — never circles)
  for (let drop = 0; drop < 70; drop++) {
    const reach = rnd();
    const cx = ox + dirX * (4 + rnd() * w * (0.12 + reach * 0.75));
    const cy = oy + dirY * (4 + rnd() * h * (0.1 + reach * 0.7));
    const radX = 1 + rnd() * (reach < 0.3 ? 16 : 4.5);
    const radY = radX * (0.35 + rnd() * 0.9);
    ctx.beginPath();
    const verts = 8 + Math.floor(rnd() * 7);
    for (let v = 0; v < verts; v++) {
      const a = (v / verts) * Math.PI * 2 + rnd() * 0.2;
      const warp = 0.35 + fbm(cx * 0.08 + Math.cos(a) * 2, cy * 0.08 + Math.sin(a) * 2, seed + drop, 3);
      const px = cx + Math.cos(a) * radX * warp;
      const py = cy + Math.sin(a) * radY * warp;
      if (v === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = `rgba(${55 + rnd() * 45}, ${12 + rnd() * 14}, ${8 + rnd() * 10}, ${0.65 + rnd() * 0.35})`;
    ctx.fill();
  }

  // Drips
  for (let drip = 0; drip < 16; drip++) {
    const x = ox + dirX * (15 + rnd() * w * 0.6);
    const y0 = oy + dirY * (8 + rnd() * 50);
    const len = 22 + rnd() * 85;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(${55 + rnd() * 35}, 14, 10, ${0.5 + rnd() * 0.4})`;
    ctx.lineWidth = 0.8 + rnd() * 2.4;
    ctx.lineCap = "round";
    let y = y0;
    let xw = x;
    ctx.moveTo(xw, y);
    const steps = 7 + Math.floor(rnd() * 6);
    for (let s = 0; s < steps; s++) {
      y += dirY * (len / steps);
      xw += (rnd() - 0.5) * 4;
      ctx.lineTo(xw, y);
    }
    ctx.stroke();
  }

  // Crack tendrils
  for (let c = 0; c < 10; c++) {
    let x = ox + dirX * (3 + rnd() * 35);
    let y = oy + dirY * (3 + rnd() * 30);
    ctx.beginPath();
    ctx.strokeStyle = `rgba(45, 10, 8, ${0.6 + rnd() * 0.35})`;
    ctx.lineWidth = 0.9 + rnd() * 1.8;
    ctx.moveTo(x, y);
    const segs = 12 + Math.floor(rnd() * 12);
    for (let s = 0; s < segs; s++) {
      x += dirX * (5 + rnd() * 15) + (rnd() - 0.5) * 10;
      y += dirY * (3 + rnd() * 13) + (rnd() - 0.5) * 7;
      ctx.lineTo(x, y);
      if (rnd() < 0.2) {
        // tiny branch
        ctx.moveTo(x, y);
        ctx.lineTo(x + (rnd() - 0.5) * 18, y + dirY * (4 + rnd() * 12));
        ctx.moveTo(x, y);
      }
    }
    ctx.stroke();
  }
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

export function applySmokeRuinTextures(stage: HTMLElement): () => void {
  const top = stage.querySelector("#uw-top") as HTMLElement | null;
  const bot = stage.querySelector("#uw-bottom") as HTMLElement | null;
  if (!top || !bot) return () => {};

  const BAR_W = 3440;
  const BAR_H = 248;

  // --- Steel plates ---
  for (const [bar, seed, quiet] of [
    [top, 101, false] as const,
    [bot, 202, true] as const,
  ]) {
    const steelHost = bar.querySelector(".smk-steel") as HTMLElement | null;
    if (!steelHost) continue;
    steelHost.innerHTML = "";
    const c = ensureLayer(steelHost, "smk-steel-canvas");
    c.width = BAR_W;
    c.height = BAR_H;
    const ctx = c.getContext("2d")!;
    paintSteelPlate(ctx, BAR_W, BAR_H, seed, quiet);
  }

  // --- Shallow consistent torn edges (small grit only; plates stay inside bar) ---
  const topProfile = buildTornProfile(BAR_W, 10, 404);
  const botProfile = buildTornProfile(BAR_W, 10, 808);

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
    drawTornRustStrip(ctx, profile, BAR_W, BAR_H, side, seed);
  }

  // Smoke / haze / wisp layers removed — user choosing next FX options

  // --- Corner blood ---
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
    const c = ensureLayer(host, "smk-blood-canvas");
    c.width = 360;
    c.height = 200;
    paintBloodSplatter(c.getContext("2d")!, 360, 200, seed, corner);
  }

  // --- Name erosion + spray ---
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
    // Spray overspray as canvas behind face
    let spray = nameplate.querySelector("canvas.smk-spray-canvas") as HTMLCanvasElement | null;
    if (!spray) {
      spray = document.createElement("canvas");
      spray.className = "smk-spray-canvas";
      spray.setAttribute("aria-hidden", "true");
      nameplate.insertBefore(spray, nameFace);
    }
    spray.width = 980;
    spray.height = 180;
    const sctx = spray.getContext("2d")!;
    sctx.clearRect(0, 0, 980, 180);
    const rnd = mulberry32(1300);
    for (let i = 0; i < 900; i++) {
      const x = 40 + rnd() * 900;
      const y = 20 + rnd() * 140;
      const n = fbm(x * 0.05, y * 0.05, 1301, 2);
      if (n < 0.55) continue;
      sctx.fillStyle = `rgba(210, 200, 180, ${0.015 + rnd() * 0.04})`;
      sctx.fillRect(x, y, 1 + rnd() * 2, 1 + rnd() * 2);
    }
  }

  // Hide obsolete geometric / smoke layers
  stage
    .querySelectorAll(
      ".smk-scratches, .smk-peel, .smk-grime, .smk-soot, .smk-impacts, .smk-wire, .smk-wisps, .smk-gloom-smoke, .uw-smoke-wisp, .uw-bar-haze, .uw-smoke-depth, .uw-header-drift, .uw-footer-drift",
    )
    .forEach((el) => {
      (el as HTMLElement).style.display = "none";
    });
  stage.querySelectorAll(".smk-name-distress, .smk-name-overspray, .smk-name-drips").forEach((el) => {
    (el as HTMLElement).style.display = "none";
  });

  return () => {};
}
