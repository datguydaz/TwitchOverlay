/**
 * Opaque keyboard animation grid — never sends key names/characters on the wire.
 * Companion maps uiohook keycodes → slot index; overlay moves hand / depresses keycaps.
 *
 * Visual layout matches scavenger.svg #prop-keyboard (Nordic, facing him).
 * Far edge (toward torso): Z X C V [SPACE] B N M   slots 22–29
 * Home: A…LÖÄ   slots 11–21
 * Q-row: Q…PÅ   slots 0–10
 * Near edge (toward viewer): number row (visual only)
 */

export const KEY_SLOT_COUNT = 30;

export interface KeySlotPos {
  /** Center X in avatar SVG user space (pre-scale). */
  cx: number;
  /** Center Y in avatar SVG user space (pre-scale). */
  cy: number;
}

/** Rest / home pose — over home-row F/G cluster (desk-plane, matches hand-left palm). */
export const HAND_HOME = { cx: 127, cy: 268 };

/** Slot centers aligned to keycap rects in scavenger.svg.ts (desk-plane). */
export const KEY_SLOTS: readonly KeySlotPos[] = [
  // Q row y≈279.5
  { cx: 68.25, cy: 279.5 },
  { cx: 81.75, cy: 279.5 },
  { cx: 95.25, cy: 279.5 },
  { cx: 108.75, cy: 279.5 },
  { cx: 122.25, cy: 279.5 },
  { cx: 135.75, cy: 279.5 },
  { cx: 149.25, cy: 279.5 },
  { cx: 162.75, cy: 279.5 },
  { cx: 176.25, cy: 279.5 },
  { cx: 189.75, cy: 279.5 },
  { cx: 203.5, cy: 279.5 },
  // A row y≈273.8
  { cx: 70.5, cy: 273.8 },
  { cx: 84.5, cy: 273.8 },
  { cx: 98.5, cy: 273.8 },
  { cx: 112.5, cy: 273.8 },
  { cx: 126.5, cy: 273.8 },
  { cx: 140.5, cy: 273.8 },
  { cx: 154.5, cy: 273.8 },
  { cx: 168.5, cy: 273.8 },
  { cx: 182.5, cy: 273.8 },
  { cx: 196.5, cy: 273.8 },
  { cx: 210.5, cy: 273.8 },
  // Z/space row y≈268 (toward him)
  { cx: 76, cy: 268 },
  { cx: 88, cy: 268 },
  { cx: 100, cy: 268 },
  { cx: 112, cy: 268 },
  { cx: 142.5, cy: 268 }, // space
  { cx: 173, cy: 268 },
  { cx: 185, cy: 268 },
  { cx: 197, cy: 268 },
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
  26: 10,
  30: 11,
  31: 12,
  32: 13,
  33: 14,
  34: 15,
  35: 16,
  36: 17,
  37: 18,
  38: 19,
  39: 20,
  40: 21,
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
