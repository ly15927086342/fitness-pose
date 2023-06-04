export const MODEL_LEFT_ANGLE = [
  [23, 11, 13],
  [12, 11, 13],
  [11, 13, 15],
  [11, 23, 25],
  [13, 15, 21],
  [13, 15, 19],
  [13, 15, 17],
  [23, 25, 27],
  [25, 27, 31],
];
export const MODEL_RIGHT_ANGLE = [
  [24, 12, 14],
  [11, 12, 14],
  [12, 14, 16],
  [12, 24, 26],
  [14, 16, 22],
  [14, 16, 20],
  [14, 16, 18],
  [24, 26, 28],
  [26, 28, 32],
];

export const MODEL_LEFT_KEY_PARAM = MODEL_LEFT_ANGLE.map((t, i) => {
  return "l" + i;
});
export const MODEL_RIGHT_KEY_PARAM = MODEL_RIGHT_ANGLE.map((t, i) => {
  return "r" + i;
});
