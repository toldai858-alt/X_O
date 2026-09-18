"use client";

import { useCallback } from "react";

export function useHapticFeedback(enabled: boolean) {
  return useCallback((celebrate = false) => {
    if (!enabled || typeof navigator.vibrate !== "function") return;
    try { navigator.vibrate(celebrate ? [20, 45, 30] : 12); }
    catch { /* Unsupported device policies must not interrupt a round. */ }
  }, [enabled]);
}
