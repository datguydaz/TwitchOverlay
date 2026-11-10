/**
 * Opaque keyboard animation grid — never sends key names/characters on the wire.
 * Companion maps uiohook keycodes → slot index; overlay moves hand / depresses keycaps.
 *
 * Visual layout matches scavenger.svg #prop-keyboard (Nordic / Swedish-style).
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
export const HAND_HOME = { cx: 110, cy: 255 };

const KW = 12.2;
const STRIDE = 13.5;
const KH = 8.5;

function rowCenters(
  startX: number,
  y: number,
  count: number,
): KeySlotPos[] {
  const cy = y + KH / 2;
  const out: KeySlotPos[] = [];
  for (let i = 0; i < count; i++) {
    out.push({ cx: startX + i * STRIDE + KW / 2, cy });
  }
  return out;
}

const Q_ROW = rowCenters(50, 250, 11);
const A_ROW = rowCenters(56.5, 260.5, 11);
const Z_LEFT = rowCenters(50, 271, 4); // Z X C V
const SPACE = { cx: 104 + 52 / 2, cy: 271 + KH / 2 };
const Z_RIGHT = rowCenters(160, 271, 3); // B N M

/** Slot centers aligned to keycap rects in scavenger.svg.ts */
export const KEY_SLOTS: readonly KeySlotPos[] = [
  ...Q_ROW,
  ...A_ROW,
  ...Z_LEFT,
  SPACE,
  ...Z_RIGHT,
];

/** uiohook-napi UiohookKey values → slot (opaque). Nordic OEM keys included. */
export const KEYCODE_TO_SLOT: Readonly<Record<number, number>> = {
  // Number row → Q-row slots (visual aim only)
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
  12: 10, // Minus / Nordic +
  13: 10, // Equals / Nordic ´
  // QWERTY…P
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
  26: 10, // BracketLeft → Å on Nordic
  // Home row A…L
  30: 11, // A
  31: 12, // S
  32: 13, // D
  33: 14, // F
  34: 15, // G
  35: 16, // H
  36: 17, // J
  37: 18, // K
  38: 19, // L
  39: 20, // Semicolon → Ö on Nordic
  40: 21, // Quote → Ä on Nordic
  // Bottom letter row
  44: 22, // Z
  45: 23, // X
  46: 24, // C
  47: 25, // V
  48: 27, // B
  49: 28, // N
  50: 29, // M
  51: 29, // Comma
  52: 29, // Period
  53: 29, // Slash
  86: 22, // IntlBackslash → < > on Nordic
  57: 26, // Space
  // Mods / navigation → edges
  15: 0, // Tab
  58: 11, // Caps
  28: 21, // Enter → near Ä
  14: 10, // Backspace → near Å
  1: 0, // Esc
  42: 22, // Shift
  54: 29, // ShiftRight
  29: 22, // Ctrl
  56: 23, // Alt
  57419: 22, // Left
  57416: 1, // Up
  57421: 29, // Right
  57424: 24, // Down
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
