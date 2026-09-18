import type { GameSettings, GameStats, Theme, WinningLine } from "@/types/game";

export const DEFAULT_SETTINGS: GameSettings = {
  names: { X: "اللاعب ×", O: "اللاعب ○" },
  sound: true,
  haptics: true,
  theme: "cosmic",
};
export const EMPTY_STATS: GameStats = {
  totalRounds: 0,
  wins: { X: 0, O: 0 },
  draws: 0,
  streak: { player: null, count: 0 },
  bestStreak: { player: null, count: 0 },
};
export const WINNING_LINES: readonly WinningLine[] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];
export const THEMES: { id: Theme; name: string }[] = [
  { id: "cosmic", name: "نيون كوني" },
  { id: "sunset", name: "غروب بنفسجي" },
  { id: "ice", name: "جليد كهربائي" },
];
export const VICTORY_MESSAGES = [
  "قراءة ممتازة للحركة الأخيرة.",
  "هيمنة كاملة على الساحة.",
  "ثلاثية مضيئة تحسم الجولة.",
];
export const STORAGE_KEYS = {
  settings: "nuqta-daira:settings:v1",
  stats: "nuqta-daira:stats:v1",
};
