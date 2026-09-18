"use client";

import { startTransition, useEffect, useState } from "react";
import { EMPTY_STATS, STORAGE_KEYS } from "@/lib/constants";
import { recordResult } from "@/lib/gameLogic";
import { parseStats, readStorage, writeStorage } from "@/lib/storage";
import type { GameStats, Player } from "@/types/game";

export function usePersistedStats() {
  const [stats, setStats] = useState<GameStats>(EMPTY_STATS);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const loaded = readStorage(STORAGE_KEYS.stats, EMPTY_STATS, parseStats);
    startTransition(() => {
      setStats(loaded.value);
      setFailed(loaded.failed);
      setReady(true);
    });
  }, []);
  useEffect(() => {
    if (ready && !writeStorage(STORAGE_KEYS.stats, stats)) startTransition(() => setFailed(true));
  }, [ready, stats]);
  const record = (winner: Player | null) => startTransition(() => setStats(current => recordResult(current, winner)));
  const reset = () => startTransition(() => setStats(EMPTY_STATS));
  return { stats, ready, failed, record, reset };
}