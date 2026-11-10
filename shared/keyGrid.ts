/**
 * Opaque keyboard animation grid — never sends key names/characters on the wire.
 * Companion maps uiohook keycodes → slot index; overlay moves hand / depresses keycaps.
 *
 * Visual layout matches scavenger.svg #prop-keyboard (Nordic, facing operator).
 * Row Q:  Q W E R T Y U I O P Å     slots 0–10
 * Row A:  A S D F G H J K L Ö Ä     slots 11–21
 * Row Z:  Z X C V [SPACE] B N M     slots 22–29 (26 = spacebar)
 */

export const KEY_SLOT_COUNT = 30;

export interface KeySlotPos {
  /** Center X in avatar SVG user space (pre-scale). */
  cx: number;
  /** Center Y in avatar SVG user space (pre-scale). */
  cy: number;
}

/** Rest / home pose — over home-row F/G cluster. */
export const HAND_HOME = { cx: 136, cy: 258 };

/** Slot centers aligned to keycap rects in scavenger.svg.ts */
export const KEY_SLOTS: readonly KeySlotPos[] = [
  // Q row y=252 h=8.2
  { cx: 80.6, cy: 256.1 },
  { cx: 94.8, cy: 256.1 },
  { cx: 109, cy: 256.1 },
  { cx: 123.2, cy: 256.1 },
  { cx: 137.4, cy: 256.1 },
  { cx: 151.6, cy: 256.1 },
  { cx: 165.8, cy: 256.1 },
  { cx: 180, cy: 256.1 },
  { cx: 194.2, cy: 256.1 },
  { cx: 208.4, cy: 256.1 },
  { cx: 222.6, cy: 256.1 },
  // A row y=262.2 h=8.4
  { cx: 84.8, cy: 266.4 },
  { cx: 99.4, cy: 266.4 },
  { cx: 114, cy: 266.4 },
  { cx: 128.6, cy: 266.4 },
  { cx: 143.2, cy: 266.4 },
  { cx: 157.8, cy: 266.4 },
  { cx: 172.4, cy: 266.4 },
  { cx: 187, cy: 266.4 },
  { cx: 201.6, cy: 266.4 },
  { cx: 216.2, cy: 266.4 },
  { cx: 230.8, cy: 266.4 },
  // Z row + space
  { cx: 70.4, cy: 277.1 },
  { cx: 85.2, cy: 277.1 },
  { cx: 100, cy: 277.1 },
  { cx: 114.8, cy: 277.1 },
  { cx: 151.7, cy: 277.1 }, // space
  { cx: 188.6, cy: 277.1 },
  { cx: 203.4, cy: 277.1 },
  { cx: 218.2, cy: 277.1 },
];

/** uiohook-napi UiohookKey values → slot (opaque). Nordic OEM keys included. */
export const KEYCODE_TO_SLOT: Readonly<Record<number, number>> = {
  2: 0,
  3: 1,
  4: 2,
  5: 3,
  6: 4,
  7: 5,
  8: 6,
  9: 7,
  10: 8,
  11: 9,
  12: 10,
  13: 10,
  16: 0,
  17: 1,
  18: 2,
  19: 3,
  20: 4,
  21: 5,
  22: 6,
  23: 7,
  24: 8,
  25: 9,
  26: 10, // BracketLeft → Å
  30: 11,
  31: 12,
  32: 13,
  33: 14,
  34: 15,
  35: 16,
  36: 17,
  37: 18,
  38: 19,
  39: 20, // Semicolon → Ö
  40: 21, // Quote → Ä
  44: 22,
  45: 23,
  46: 24,
  47: 25,
  48: 27,
  49: 28,
  50: 29,
  51: 29,
  52: 29,
  53: 29,
  86: 22,
  57: 26,
  15: 0,
  58: 11,
  28: 21,
  14: 10,
  1: 0,
  42: 22,
  54: 29,
  29: 22,
  56: 23,
  57419: 22,
  57416: 1,
  57421: 29,
  57424: 24,
};

export function slotFromKeycode(keycode: number): number {
  const s = KEYCODE_TO_SLOT[keycode];
  if (s != null) return s;
  return ((keycode % KEY_SLOT_COUNT) + KEY_SLOT_COUNT) % KEY_SLOT_COUNT;
}

export function slotPos(slot: number): KeySlotPos {
  const i = Math.max(0, Math.min(KEY_SLOT_COUNT - 1, slot | 0));
  return KEY_SLOTS[i]!;
}
