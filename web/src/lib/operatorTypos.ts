/**
 * Comedic wrong-first type-ins for follow/sub. Never emits blocked tokens.
 */

const QWERTY: Record<string, string> = {
  a: "qwsz",
  b: "vghn",
  c: "xdfv",
  d: "erfcxs",
  e: "rdsw",
  f: "rtgvcd",
  g: "tyhbvf",
  h: "yujnbg",
  i: "uojk",
  j: "uiknhm",
  k: "ioljm",
  l: "opk",
  m: "njk",
  n: "bhjm",
  o: "iplk",
  p: "ol",
  q: "wa",
  r: "edft",
  s: "awedxz",
  t: "rfgy",
  u: "yhji",
  v: "cfgb",
  w: "qase",
  x: "zsdc",
  y: "tghu",
  z: "asx",
  "0": "9-",
  "1": "2q",
  "2": "13w",
  "3": "24e",
  "4": "35r",
  "5": "46t",
  "6": "57y",
  "7": "68u",
  "8": "79i",
  "9": "80o",
  _: "-.",
  "-": "0_",
};

/** Safe silly name-ish endings (never rude). */
const NONSENSE_TAILS = [
  "BOT",
  "X",
  "ZZ",
  "NPC",
  "AFK",
  "LOOT",
  "BAG",
  "OPS",
  "RAID",
  "PING",
  "BUDDY",
  "SCOUT",
  "GEAR",
  "MAP",
  "KEY",
  "BOX",
  "TAG",
  "COMMS",
  "BEAN",
  "NOODLE",
  "POTATO",
  "GOOBER",
  "DOODLE",
  "BANANA",
  "WAFFLE",
  "PICKLE",
  "MUFFIN",
  "SPORK",
  "BLORP",
  "ZORP",
];

/**
 * Compact blocklist — substrings (case-insensitive). Keep conservative.
 * Any candidate containing these is rejected and regenerated / discarded.
 */
const BLOCKED = [
  "nigg",
  "fag",
  "retard",
  "rape",
  "suic",
  "kill yourself",
  "kys",
  "slut",
  "whore",
  "cunt",
  "dick",
  "cock",
  "pussy",
  "penis",
  "vagina",
  "anal",
  "shit",
  "fuck",
  "asshole",
  "bitch",
  "bastard",
  "dyke",
  "tranny",
  "homo",
  "spic",
  "chink",
  "gook",
  "kike",
  "wetback",
  "beaner",
  "coon",
  "negro",
  "rape",
  "porn",
  "sex",
  "nude",
  "nazi",
  "hitler",
  "terror",
];

export type TypoKind = "adjacent" | "transpose" | "wrongword";

export function isBlockedText(raw: string): boolean {
  const s = String(raw || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!s) return true;
  return BLOCKED.some((b) => s.includes(b.replace(/[^a-z0-9]/g, "")));
}

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function neighbor(ch: string): string {
  const lower = ch.toLowerCase();
  const pool = QWERTY[lower];
  if (!pool || !pool.length) return ch;
  const n = pool[Math.floor(Math.random() * pool.length)]!;
  return ch === ch.toUpperCase() && /[a-z]/i.test(ch) ? n.toUpperCase() : n;
}

function adjacentTypo(name: string): string | null {
  const chars = [...name];
  if (chars.length < 3) return null;
  // Prefer mid-name letter/digit
  const idxs = chars
    .map((c, i) => (/[a-z0-9]/i.test(c) ? i : -1))
    .filter((i) => i > 0 && i < chars.length - 1);
  if (!idxs.length) return null;
  const i = rand(idxs);
  const next = neighbor(chars[i]!);
  if (next === chars[i]) return null;
  chars[i] = next;
  const out = chars.join("");
  return out === name || isBlockedText(out) ? null : out;
}

function transposeTypo(name: string): string | null {
  const chars = [...name];
  if (chars.length < 4) return null;
  const start = 1;
  const end = chars.length - 2;
  if (end <= start) return null;
  const i = start + Math.floor(Math.random() * (end - start));
  const a = chars[i]!;
  const b = chars[i + 1]!;
  if (a === b) return null;
  chars[i] = b;
  chars[i + 1] = a;
  const out = chars.join("");
  return out === name || isBlockedText(out) ? null : out;
}

function wrongWordTypo(name: string, dramatic: boolean): string | null {
  const chars = [...name];
  if (chars.length < 4) return null;
  const keep = Math.min(3, Math.max(2, Math.floor(chars.length * 0.35)));
  const prefix = chars.slice(0, keep).join("");
  let tail = rand(NONSENSE_TAILS);
  if (dramatic && Math.random() < 0.45) {
    tail = rand(NONSENSE_TAILS) + rand(["X", "Z", "99", "7", ""]);
  }
  // Match rough casing of the original (often UPPER)
  const upperHeavy =
    name === name.toUpperCase() ||
    [...name].filter((c) => /[A-Z]/.test(c)).length >
      [...name].filter((c) => /[a-z]/.test(c)).length;
  if (upperHeavy) tail = tail.toUpperCase();
  else tail = tail[0] + tail.slice(1).toLowerCase();

  let out = prefix + tail;
  // Keep length comedy — not wildly longer than name
  if (out.length > name.length + 4) out = out.slice(0, name.length + 4);
  if (out === name || isBlockedText(out)) return null;
  return out;
}

/**
 * Build a safe wrong string for the typo beat.
 * Returns null if nothing safe could be made (caller skips typo).
 */
export function makeWrongName(correct: string, opts?: { dramatic?: boolean }): {
  wrong: string;
  kind: TypoKind;
} | null {
  const name = String(correct || "").trim();
  if (name.length < 4 || isBlockedText(name)) return null;

  const dramatic = !!opts?.dramatic;
  const order: TypoKind[] = dramatic
    ? ["wrongword", "adjacent", "transpose", "wrongword"]
    : ["adjacent", "transpose", "wrongword", "adjacent"];

  // Shuffle lightly
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }

  for (const kind of order) {
    let wrong: string | null = null;
    if (kind === "adjacent") wrong = adjacentTypo(name);
    else if (kind === "transpose") wrong = transposeTypo(name);
    else wrong = wrongWordTypo(name, dramatic);
    if (wrong && !isBlockedText(wrong)) return { wrong, kind };
  }
  return null;
}

/** Skip typos when the correct name would blow the ~5s budget. */
export function nameTooLongForTypo(name: string): boolean {
  const n = String(name || "").trim().length;
  // ~140ms/char * (wrong+correct) + pauses ≈ over budget past ~12–14
  return n > 12 || n < 4;
}
