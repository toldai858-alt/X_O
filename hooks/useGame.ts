"use client";

import { startTransition, useEffect, useReducer, useState } from "react";
import { EMPTY_STATS, STORAGE_KEYS } from "@/lib/constants";
import { createGame, gameReducer } from "@/lib/gameLogic";
import { parseStats, readStorage, writeStorage } from "@/lib/storage";

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createGame);
  const [ready, setReady] = useState(false);
  const [storageFailed, setStorageFailed] = useState(false);
  useEffect(() => {
    const loaded = readStorage(STORAGE_KEYS.stats, EMPTY_STATS, parseStats);
    startTransition(() => {
      dispatch({ type: "hydrate", stats: loaded.value });
      setStorageFailed(loaded.failed);
      setReady(true);
    });
  }, []);
  useEffect(() => {
    if (ready && !writeStorage(STORAGE_KEYS.stats, state.stats)) startTransition(() => setStorageFailed(true));
  }, [ready, state.stats]);
  return { state, dispatch, ready, storageFailed };
}
