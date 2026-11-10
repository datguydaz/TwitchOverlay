/**
 * Hand-built distressed stencil / hazard letterforms (original paths).
 * Units: each glyph fits ~[0..12] x [0..16]. Gaps mimic stencil cuts.
 */

const GLYPH_W = 12;
const GLYPH_GAP = 2.2;

/** Path `d` strings in local glyph space (amber fill + dark outline applied by renderer). */
const GLYPHS: Record<string, string> = {
  a: "M1 15 L5.5 1 H7 L11.5 15 H9.2 L8.2 11 H4.2 L3.2 15 Z M4.8 9 H7.6 L6.2 4 Z",
  b: "M1.5 1 H7.5 Q11 1 11 5 Q11 7.5 8.5 8.5 Q11.5 9 11.5 12.5 Q11.5 15.5 7.5 15.5 H1.5 Z M3.8 3.2 V6.8 H7 Q8.6 6.8 8.6 5 Q8.6 3.2 7 3.2 Z M3.8 9.5 V13.2 H7.2 Q9 13.2 9 11.4 Q9 9.5 7.2 9.5 Z",
  c: "M10.5 3.2 Q8 1 5 1 Q1.2 1 1.2 8 Q1.2 15 5 15 Q8.2 15 10.5 12.6 L8.6 11 Q7.2 12.8 5.2 12.8 Q3.4 12.8 3.4 8 Q3.4 3.2 5.2 3.2 Q7 3.2 8.6 4.8 Z",
  d: "M1.5 1 H6.5 Q11.2 1 11.2 8 Q11.2 15 6.5 15 H1.5 Z M3.8 3.2 V12.8 H6.2 Q8.8 12.8 8.8 8 Q8.8 3.2 6.2 3.2 Z",
  e: "M1.5 1 H10.5 V3.2 H3.8 V6.8 H9.2 V9 H3.8 V12.8 H10.8 V15 H1.5 Z",
  f: "M1.5 1 H10.5 V3.2 H3.8 V7 H8.8 V9.2 H3.8 V15 H1.5 Z",
  g: "M10.5 3 Q8 1 5 1 Q1.2 1 1.2 8 Q1.2 15 5.2 15 Q8.8 15 10.6 12.2 V8.2 H6.2 V10.2 H8.4 V12.2 Q7.4 13 5.4 13 Q3.4 13 3.4 8 Q3.4 3.2 5.2 3.2 Q7.2 3.2 8.8 4.8 Z",
  h: "M1.5 1 H3.8 V6.8 H8.2 V1 H10.5 V15 H8.2 V9 H3.8 V15 H1.5 Z",
  i: "M4.5 1 H7.5 V3 H4.5 Z M4.5 5 H7.5 V15 H4.5 Z",
  j: "M6.5 1 H9.5 V3 H6.5 Z M6.5 5 H9.5 V11.5 Q9.5 15.5 5 15.5 Q2 15.5 1.2 13 L3.2 11.8 Q3.8 13.2 5.2 13.2 Q6.5 13.2 6.5 11.5 Z",
  k: "M1.5 1 H3.8 V7 L8.2 1 H11 L6.2 7.5 L11.2 15 H8.2 L3.8 8.5 V15 H1.5 Z",
  l: "M1.5 1 H3.8 V12.8 H10.5 V15 H1.5 Z",
  m: "M1 15 V1 H3.2 L6 9 L8.8 1 H11 V15 H8.8 V6 L6.6 12 H5.4 L3.2 6 V15 Z",
  n: "M1.5 15 V1 H3.6 L8.2 10 V1 H10.5 V15 H8.2 L3.6 5.5 V15 Z",
  o: "M6 1 Q10.8 1 10.8 8 Q10.8 15 6 15 Q1.2 15 1.2 8 Q1.2 1 6 1 Z M6 3.3 Q3.5 3.3 3.5 8 Q3.5 12.7 6 12.7 Q8.5 12.7 8.5 8 Q8.5 3.3 6 3.3 Z",
  p: "M1.5 1 H7.2 Q11 1 11 6.5 Q11 11.5 7.2 11.5 H3.8 V15 H1.5 Z M3.8 3.2 V9.2 H7 Q8.7 9.2 8.7 6.5 Q8.7 3.2 7 3.2 Z",
  q: "M6 1 Q10.8 1 10.8 8 Q10.8 13 8.5 14.2 L11 15 L9.5 16.2 L6.8 14.8 Q1.2 14.2 1.2 8 Q1.2 1 6 1 Z M6 3.3 Q3.5 3.3 3.5 8 Q3.5 12.2 6 12.2 Q8.5 12.2 8.5 8 Q8.5 3.3 6 3.3 Z",
  r: "M1.5 1 H7.2 Q11 1 11 6 Q11 9.2 8.2 10 L11.2 15 H8.5 L5.5 10 H3.8 V15 H1.5 Z M3.8 3.2 V7.8 H7 Q8.6 7.8 8.6 5.5 Q8.6 3.2 7 3.2 Z",
  s: "M10.5 3.5 Q8.5 1 5.2 1 Q1.5 1 1.5 5 Q1.5 7.5 5 8.5 L7.5 9.2 Q9.2 9.8 9.2 11.5 Q9.2 13.2 6 13.2 Q3.5 13.2 2 11.5 L0.8 13.2 Q2.8 15.5 6.2 15.5 Q11 15.5 11 11.2 Q11 8.5 7.5 7.2 L5 6.2 Q3.5 5.6 3.5 4.5 Q3.5 3.2 5.5 3.2 Q7.5 3.2 8.8 4.5 Z",
  t: "M1 1 H11 V3.2 H7.2 V15 H4.8 V3.2 H1 Z",
  u: "M1.5 1 H3.8 V10.5 Q3.8 13 6 13 Q8.2 13 8.2 10.5 V1 H10.5 V10.5 Q10.5 15.5 6 15.5 Q1.5 15.5 1.5 10.5 Z",
  v: "M1 1 H3.4 L6 11.5 L8.6 1 H11 L7.2 15 H4.8 Z",
  w: "M0.5 1 H2.6 L4 11 L6 3 H7.5 L9.5 11 L11 1 H13 L10.5 15 H8.2 L6.8 8 L5.2 15 H2.8 Z",
  x: "M1 1 H3.4 L6 6.5 L8.6 1 H11 L7.4 8 L11 15 H8.6 L6 9.5 L3.4 15 H1 L4.6 8 Z",
  y: "M1 1 H3.4 L6 7 L8.6 1 H11 L7.2 9 V15 H4.8 V9 Z",
  z: "M1.2 1 H10.8 V3.2 L4.2 12.8 H11 V15 H1 V12.8 L7.6 3.2 H1.2 Z",
  "0": "M6 1 Q10.5 1 10.5 8 Q10.5 15 6 15 Q1.5 15 1.5 8 Q1.5 1 6 1 Z M6 3.4 Q3.7 3.4 3.7 8 Q3.7 12.6 6 12.6 Q8.3 12.6 8.3 8 Q8.3 3.4 6 3.4 Z",
  "1": "M5 1 H7.5 L9 3 V15 H6.5 V4.5 H4.2 Z",
  "2": "M1.5 3.5 Q1.5 1 6 1 Q10.5 1 10.5 5 Q10.5 8 6.5 10 L3.8 12.8 H11 V15 H1 V12.2 L5.5 8 Q8.2 6.2 8.2 5 Q8.2 3.4 6 3.4 Q3.8 3.4 3.5 5 Z",
  "3": "M1.8 3 Q1.8 1 6 1 Q10 1 10 5 Q10 7.5 7.5 8.5 Q10.2 9.2 10.2 12 Q10.2 15.5 5.8 15.5 Q2 15.5 1.5 12.5 L3.6 11.5 Q4 13.2 5.8 13.2 Q7.8 13.2 7.8 11.5 Q7.8 9.8 5.8 9.8 H4.5 V7.8 H5.8 Q7.6 7.8 7.6 5.5 Q7.6 3.4 5.8 3.4 Q4 3.4 3.8 5 Z",
  "4": "M8 1 H10.2 V9.5 H11.5 V12 H10.2 V15 H7.8 V12 H1.2 V9.2 L7.2 1 Z M3.8 9.5 H7.8 V4.2 Z",
  "5": "M10 1 H2 V8 H6.5 Q9.5 8 9.5 11.5 Q9.5 14.5 6 14.5 Q3.2 14.5 2.2 12.2 L4 11 Q4.6 12.5 6 12.5 Q7.4 12.5 7.4 11.2 Q7.4 10 6 10 H2 V1 H10 Z",
  "6": "M9.5 3 Q7.5 1 5 1 Q1.5 1 1.5 8.5 Q1.5 15 6 15 Q10.5 15 10.5 10.5 Q10.5 6.5 6.5 6.5 H3.8 V4.2 Q4.2 3.2 5.5 3.2 Q7 3.2 8 4.2 Z M3.8 8.8 H6.5 Q8.2 8.8 8.2 10.8 Q8.2 12.8 6.2 12.8 Q3.8 12.8 3.8 10.2 Z",
  "7": "M1.2 1 H10.8 V3.4 L5.2 15 H2.8 L8.2 3.4 H1.2 Z",
  "8": "M6 1 Q10.2 1 10.2 5 Q10.2 7.5 8 8.5 Q10.5 9.2 10.5 12.2 Q10.5 15.5 6 15.5 Q1.5 15.5 1.5 12.2 Q1.5 9.2 4 8.5 Q1.8 7.5 1.8 5 Q1.8 1 6 1 Z M6 3.2 Q4 3.2 4 5 Q4 6.8 6 6.8 Q8 6.8 8 5 Q8 3.2 6 3.2 Z M6 9.5 Q4 9.5 4 12 Q4 13.5 6 13.5 Q8 13.5 8 12 Q8 9.5 6 9.5 Z",
  "9": "M2.5 13 Q4.5 15 7 15 Q10.5 15 10.5 7.5 Q10.5 1 6 1 Q1.5 1 1.5 5.5 Q1.5 9.5 5.5 9.5 H8.2 V11.8 Q7.8 12.8 6.5 12.8 Q5 12.8 4 11.8 Z M8.2 7.2 H5.5 Q3.8 7.2 3.8 5.2 Q3.8 3.2 5.8 3.2 Q8.2 3.2 8.2 5.8 Z",
  "-": "M2.5 7 H9.5 V9.2 H2.5 Z",
  "_": "M1 13 H11 V15 H1 Z",
  " ": "",
};

export function renderStencilName(name: string): string {
  const raw = (name.trim() || "datguydaz").toLowerCase().slice(0, 16);
  const chars = [...raw];
  const totalW =
    chars.reduce((w, ch) => w + (ch === " " ? GLYPH_W * 0.55 : GLYPH_W), 0) +
    Math.max(0, chars.length - 1) * GLYPH_GAP;
  let x = -totalW / 2;
  const parts: string[] = [];

  for (const ch of chars) {
    const d = GLYPHS[ch] ?? GLYPHS["-"];
    if (ch === " ") {
      x += GLYPH_W * 0.55 + GLYPH_GAP;
      continue;
    }
    if (d) {
      // Dark outline (slightly expanded via thicker stroke) + amber fill + scratch shadow
      parts.push(
        `<g transform="translate(${x.toFixed(2)} 0)">` +
          `<path d="${d}" fill="#1a1408" transform="translate(0.6 0.7)" opacity="0.55"/>` +
          `<path d="${d}" fill="none" stroke="#1a1208" stroke-width="1.35" stroke-linejoin="round"/>` +
          `<path d="${d}" fill="#d4a03a"/>` +
          `<path d="${d}" fill="#f0c060" opacity="0.35" transform="translate(-0.25 -0.35)"/>` +
          // stencil scratch cuts
          `<path d="M2 5 H10 M3 11 H9" stroke="#1a1c18" stroke-width="0.7" opacity="0.45"/>` +
          `</g>`,
      );
    }
    x += GLYPH_W + GLYPH_GAP;
  }

  return parts.join("");
}
