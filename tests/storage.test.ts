import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS, EMPTY_STATS } from "@/lib/constants";
import { parseSettings, parseStats, readStorage, writeStorage } from "@/lib/storage";

afterEach(() => vi.unstubAllGlobals());
describe("storage validation", () => {
  it("recovers from malformed or missing settings and bounds names", () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    const settings = parseSettings({ names: { X: " ", O: "أ".repeat(50) }, sound: false, haptics: "true", theme: "invalid" });
    expect(settings.names.X).toBe(DEFAULT_SETTINGS.names.X);
    expect(settings.names.O).toHaveLength(24);
    expect(settings.sound).toBe(false);
    expect(settings.haptics).toBe(true);
    expect(settings.theme).toBe("cosmic");
  });
  it("rejects inconsistent or invalid totals", () => {
    for (const value of [null, [], { ...EMPTY_STATS, totalRounds: -1 }, { ...EMPTY_STATS, totalRounds: 5 }, { ...EMPTY_STATS, draws: 1.5 }]) expect(parseStats(value)).toEqual(EMPTY_STATS);
  });
  it("repairs impossible streak values", () => {
    expect(parseStats({ ...EMPTY_STATS, streak: { player: "X", count: 100 } }).streak.count).toBe(0);
  });
  it("handles malformed JSON without crashing", () => {
    vi.stubGlobal("window", { localStorage: { getItem: () => "{broken" } });
    expect(readStorage("settings", DEFAULT_SETTINGS, parseSettings)).toEqual({ value: DEFAULT_SETTINGS, failed: false });
  });
  it("handles denied reads and writes", () => {
    vi.stubGlobal("window", { localStorage: { getItem: () => { throw new Error("Denied"); }, setItem: () => { throw new Error("Quota"); } } });
    expect(readStorage("stats", EMPTY_STATS, parseStats)).toEqual({ value: EMPTY_STATS, failed: true });
    expect(writeStorage("stats", EMPTY_STATS)).toBe(false);
  });
});
