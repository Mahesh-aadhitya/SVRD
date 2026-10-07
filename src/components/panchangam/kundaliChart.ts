import type { GrahaKey } from "@/lib/panchang/names";

// Two-letter graha marks for the chart squares.
export const SHORT: Record<GrahaKey, { en: string; kn: string }> = {
  sun: { en: "Su", kn: "ರ" },
  moon: { en: "Mo", kn: "ಚಂ" },
  mars: { en: "Ma", kn: "ಕು" },
  mercury: { en: "Me", kn: "ಬು" },
  jupiter: { en: "Ju", kn: "ಗು" },
  venus: { en: "Ve", kn: "ಶು" },
  saturn: { en: "Sa", kn: "ಶ" },
  rahu: { en: "Ra", kn: "ರಾ" },
  ketu: { en: "Ke", kn: "ಕೇ" },
};

// South Indian chart: rashis sit in fixed squares, Meena top-left, going
// clockwise; the four centre squares hold the chart's title.
export const SQUARE_OF_RASHI: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [1, 3], [2, 3], [3, 3], [3, 2], [3, 1], [3, 0], [2, 0], [1, 0], [0, 0],
];
