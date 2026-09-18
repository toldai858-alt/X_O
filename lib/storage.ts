import { DEFAULT_SETTINGS, EMPTY_STATS } from "@/lib/constants";
import type { GameSettings, GameStats, Player } from "@/types/game";

const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const count = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const player = (value: unknown): value is Player => value === "X" || value === "O";

export function parseSettings(value: unknown): GameSettings {
  if (!object(value)) return DEFAULT_SETTINGS;
  const names = object(value.names) ? value.names : {};
  const name = (key: Player) => typeof names[key] === "string" && names[key].trim() ? names[key].trim().slice(0, 24) : DEFAULT_SETTINGS.names[key];
  return {
    names: { X: name("X"), O: name("O") },
    sound: typeof value.sound === "boolean" ? value.sound : true,
    haptics: typeof value.haptics === "boolean" ? value.haptics : true,
    theme: value.theme === "sunset" || value.theme === "ice" ? value.theme : "cosmic",
  };
}
export function parseStats(value: unknown): GameStats {
  if (!object(value) || !object(value.wins) || !count(value.totalRounds) || !count(value.draws) || !count(value.wins.X) || !count(value.wins.O)) return EMPTY_STATS;
  if (value.totalRounds !== value.wins.X + value.wins.O + value.draws) return EMPTY_STATS;
  const streak = (input: unknown): GameStats["streak"] => {
    if (!object(input) || !count(input.count) || input.count === 0 || !player(input.player)) return { player: null, count: 0 };
    const wins = value.wins;
    const playerWins = object(wins) ? wins[input.player] : undefined;
    if (!count(playerWins) || input.count > playerWins) return { player: null, count: 0 };
    return { player: input.player, count: input.count };
  };
  const current = streak(value.streak);
  const best = streak(value.bestStreak);
  return { totalRounds: value.totalRounds, wins: { X: value.wins.X, O: value.wins.O }, draws: value.draws, streak: current, bestStreak: best.count >= current.count ? best : current };
}
export function readStorage<T>(key: string, fallback: T, parse: (value: unknown) => T): { value: T; failed: boolean } {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return { value: fallback, failed: false };
    try { return { value: parse(JSON.parse(raw) as unknown), failed: false }; }
    catch { return { value: fallback, failed: false }; }
  } catch { return { value: fallback, failed: true }; }
}
export function writeStorage<T>(key: string, value: T): boolean {
  try { window.localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}
