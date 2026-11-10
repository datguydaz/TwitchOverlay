/**
 * Opaque keyboard animation grid — never sends key names/characters on the wire.
 * Companion maps uiohook keycodes → slot index; overlay moves hand / depresses keycaps.
 *
 * Visual layout matches scavenger.svg #prop-keyboard (2 rows).
 * Row 0: 10 keys  slots 0–9
 * Row 1: 8 keys   slots 10–17 (slot 13 = spacebar)
 */

export const KEY_SLOT_COUNT = 18;

export interface KeySlotPos {
  /** Center X in avatar SVG user space (pre-scale). */
  cx: number;
  /** Center Y in avatar SVG user space (pre-scale). */
  cy: number;
}

/** Rest / home pose — over home-row SDF cluster. */
export const HAND_HOME = { cx: 128, cy: 248 };

/** Slot centers aligned to keycap rects in scavenger.svg.ts */
export const KEY_SLOTS: readonly KeySlotPos[] = [
  // Row 0 (top) — QWERTY row visual
  { cx: 67.5, cy: 257.5 },
  { cx: 85.5, cy: 257.5 },
  { cx: 103.5, cy: 257.5 },
  { cx: 121.5, cy: 257.5 },
  { cx: 139.5, cy: 257.5 },
  { cx: 157.5, cy: 257.5 },
  { cx: 175.5, cy: 257.5 },
  { cx: 193.5, cy: 257.5 },
  { cx: 211.5, cy: 257.5 },
  { cx: 228, cy: 257.5 },
  // Row 1 (bottom) — ASDF + space + right cluster
  { cx: 73, cy: 270.5 },
  { cx: 90, cy: 270.5 },
  { cx: 107, cy: 270.5 },
  { cx: 143, cy: 270.5 }, // space
  { cx: 179, cy: 270.5 },
  { cx: 196, cy: 270.5 },
  { cx: 213, cy: 270.5 },
  { cx: 229, cy: 270.5 },
];

/** uiohook-napi UiohookKey values → slot (opaque). */
export const KEYCODE_TO_SLOT: Readonly<Record<number, number>> = {
  // Number row → top row slots
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
  // QWERTY
  16: 0, // Q
  17: 1, // W
  18: 2, // E
  19: 3, // R
  20: 4, // T
  21: 5, // Y
  22: 6, // U
  23: 7, // I
  24: 8, // O
  25: 9, // P
  // Home row
  30: 10, // A
  31: 11, // S
  32: 12, // D
  33: 13, // F → space visual zone (wide) — use slot near space left; prefer 12/13
  34: 13, // G → space area
  35: 14, // H
  36: 15, // J
  37: 16, // K
  38: 17, // L
  // Bottom letter row → bottom slots
  44: 10, // Z
  45: 11, // X
  46: 12, // C
  47: 13, // V
  48: 14, // B
  49: 15, // N
  50: 16, // M
  // Mods / navigation → edges
  57: 13, // Space
  15: 0, // Tab
  58: 10, // Caps
  28: 17, // Enter
  14: 9, // Backspace
  1: 0, // Esc
  42: 10, // Shift
  54: 17, // ShiftRight (common)
  29: 10, // Ctrl
  56: 11, // Alt
  57419: 10, // Left
  57416: 1, // Up
  57421: 17, // Right
  57424: 12, // Down
};

export function slotFromKeycode(keycode: number): number {
  const s = KEYCODE_TO_SLOT[keycode];
  if (s != null) return s;
  // Stable hash into grid — still opaque, no key identity leaked
  return ((keycode % KEY_SLOT_COUNT) + KEY_SLOT_COUNT) % KEY_SLOT_COUNT;
}

export function slotPos(slot: number): KeySlotPos {
  const i = Math.max(0, Math.min(KEY_SLOT_COUNT - 1, slot | 0));
  return KEY_SLOTS[i]!;
}
