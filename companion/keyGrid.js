/**
 * Opaque keycode → animation slot (mirrors shared/keyGrid.ts).
 * Never emits key names/characters.
 */
export const KEY_SLOT_COUNT = 18;

const KEYCODE_TO_SLOT = {
  2: 0, 3: 1, 4: 2, 5: 3, 6: 4, 7: 5, 8: 6, 9: 7, 10: 8, 11: 9,
  16: 0, 17: 1, 18: 2, 19: 3, 20: 4, 21: 5, 22: 6, 23: 7, 24: 8, 25: 9,
  30: 10, 31: 11, 32: 12, 33: 12, 34: 13, 35: 14, 36: 15, 37: 16, 38: 17,
  44: 10, 45: 11, 46: 12, 47: 13, 48: 14, 49: 15, 50: 16,
  57: 13, 15: 0, 58: 10, 28: 17, 14: 9, 1: 0, 42: 10, 54: 17, 29: 10, 56: 11,
  57419: 10, 57416: 1, 57421: 17, 57424: 12,
};

export function slotFromKeycode(keycode) {
  const s = KEYCODE_TO_SLOT[keycode];
  if (s != null) return s;
  return ((keycode % KEY_SLOT_COUNT) + KEY_SLOT_COUNT) % KEY_SLOT_COUNT;
}
