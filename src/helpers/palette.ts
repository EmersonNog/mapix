export const PALETTE_HEX: string[] = [
  "#ffffff",
  "#000000",
  "#e6194B",
  "#f58231",
  "#ffe119",
  "#3cb44b",
  "#46f0f0",
  "#4363d8",
  "#911eb4",
  "#f032e6",

  "#bcf60c",
  "#fabebe",
  "#008080",
  "#e6beff",
  "#9A6324",
  "#fffac8",
  "#800000",
  "#aaffc3",
  "#808000",
  "#ffd8b1",
  "#000075",
  "#808080",
];

export const PALETTE_VALUES: number[] = Array.from(
  { length: PALETTE_HEX.length },
  (_, i) => Math.floor((i * 256) / PALETTE_HEX.length)
);
