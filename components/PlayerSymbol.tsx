"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Player } from "@/types/game";

export function PlayerSymbol({ player, animated = true, className = "" }: { player: Player; animated?: boolean; className?: string }) {
  const reduced = useReducedMotion();
  const initial = animated && !reduced ? { pathLength: 0, opacity: 0 } : false;
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" className={`player-symbol symbol-${player.toLowerCase()} ${className}`}>
      {player === "X" ? <>
        <motion.path d="M28 28L72 72" stroke="currentColor" strokeWidth="8" strokeLinecap="round" initial={initial} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: reduced ? 0 : 0.24 }} />
        <motion.path d="M72 28L28 72" stroke="currentColor" strokeWidth="8" strokeLinecap="round" initial={initial} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: reduced ? 0 : 0.24, delay: reduced ? 0 : 0.1 }} />
      </> : <motion.circle cx="50" cy="50" r="27" stroke="currentColor" strokeWidth="7" strokeLinecap="round" initial={initial} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: reduced ? 0 : 0.4 }} />}
    </svg>
  );
}
