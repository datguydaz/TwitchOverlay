/**
 * Opaque keycode → animation slot (mirrors shared/keyGrid.ts).
 * Never emits key names/characters. Nordic OEM → ÅÄÖ slots.
 */
export const KEY_SLOT_COUNT = 30;

const KEYCODE_TO_SLOT = {
  2: 0, 3: 1, 4: 2, 5: 3, 6: 4, 7: 5, 8: 6, 9: 7, 10: 8, 11: 9, 12: 10, 13: 10,
  16: 0, 17: 1, 18: 2, 19: 3, 20: 4, 21: 5, 22: 6, 23: 7, 24: 8, 25: 9, 26: 10,
  30: 11, 31: 12, 32: 13, 33: 14, 34: 15, 35: 16, 36: 17, 37: 18, 38: 19, 39: 20, 40: 21,
  44: 22, 45: 23, 46: 24, 47: 25, 48: 27, 49: 28, 50: 29, 51: 29, 52: 29, 53: 29, 86: 22,
  57: 26, 15: 0, 58: 11, 28: 21, 14: 10, 1: 0, 42: 22, 54: 29, 29: 22, 56: 23,
  57419: 22, 57416: 1, 57421: 29, 57424: 24,
};

export function slotFromKeycode(keycode) {
  const s = KEYCODE_TO_SLOT[keycode];
  if (s != null) return s;
  return ((keycode % KEY_SLOT_COUNT) + KEY_SLOT_COUNT) % KEY_SLOT_COUNT;
}
