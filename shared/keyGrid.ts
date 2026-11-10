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

/** Rest / home pose — over home-row F/G cluster. */
export const HAND_HOME = { cx: 133, cy: 252 };

/** Slot centers aligned to keycap rects in scavenger.svg.ts */
export const KEY_SLOTS: readonly KeySlotPos[] = [
  // Q row y=263.5
  { cx: 74.75, cy: 267.6 },
  { cx: 89.25, cy: 267.6 },
  { cx: 103.75, cy: 267.6 },
  { cx: 118.25, cy: 267.6 },
  { cx: 132.75, cy: 267.6 },
  { cx: 147.25, cy: 267.6 },
  { cx: 161.75, cy: 267.6 },
  { cx: 176.25, cy: 267.6 },
  { cx: 190.75, cy: 267.6 },
  { cx: 205.25, cy: 267.6 },
  { cx: 219.75, cy: 267.6 },
  // A row y=253
  { cx: 84.4, cy: 257 },
  { cx: 98.2, cy: 257 },
  { cx: 112, cy: 257 },
  { cx: 125.8, cy: 257 },
  { cx: 139.6, cy: 257 },
  { cx: 153.4, cy: 257 },
  { cx: 167.2, cy: 257 },
  { cx: 181, cy: 257 },
  { cx: 194.8, cy: 257 },
  { cx: 208.6, cy: 257 },
  { cx: 222.4, cy: 257 },
  // Z/space row y=243 (toward him)
  { cx: 99.25, cy: 246.75 },
  { cx: 111.75, cy: 246.75 },
  { cx: 124.25, cy: 246.75 },
  { cx: 136.75, cy: 246.75 },
  { cx: 164.5, cy: 246.75 }, // space
  { cx: 192.25, cy: 246.75 },
  { cx: 204.75, cy: 246.75 },
  { cx: 217.25, cy: 246.75 },
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
