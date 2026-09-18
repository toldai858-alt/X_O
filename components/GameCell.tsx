"use client";

import { motion, useReducedMotion } from "framer-motion";
import { PlayerSymbol } from "@/components/PlayerSymbol";
import type { CellValue } from "@/types/game";

export function GameCell({ board, cell, value, locked, onSelect }: { board: number; cell: number; value: CellValue; locked: boolean; onSelect: (board: number, cell: number) => void }) {
  const reduced = useReducedMotion();
  const symbol = value === "X" ? "×" : "○";
  return <motion.button type="button" className={`game-cell ${value ? `cell-${value.toLowerCase()}` : "cell-empty"}`} data-board={board} data-cell={cell} aria-label={`اللوحة ${board + 1}، الصف ${Math.floor(cell / 3) + 1}، العمود ${cell % 3 + 1}، ${value ? symbol : "خانة فارغة"}`} aria-disabled={locked || value !== null} onClick={() => { if (!locked && !value) onSelect(board, cell); }} whileTap={!locked && !value && !reduced ? { scale: 0.9 } : undefined}>
    {value ? <PlayerSymbol player={value} /> : null}
  </motion.button>;
}