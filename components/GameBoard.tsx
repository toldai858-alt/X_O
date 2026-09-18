"use client";

import { motion, useReducedMotion } from "framer-motion";
import { GameCell } from "@/components/GameCell";
import { PlayerSymbol } from "@/components/PlayerSymbol";
import { getMetaLine } from "@/lib/gameLogic";
import type { MatchState } from "@/types/game";

export function GameBoard({ match, onSelect, disabled = false }: { match: MatchState; onSelect: (board: number, cell: number) => void; disabled?: boolean }) {
  const { boards, activeBoard, status, winner } = match;
  const marks = boards.map(mini => mini.mark);
  const line = getMetaLine(marks);
  const reduced = useReducedMotion();
  const point = (index: number) => ({ x: (index % 3) * 100 + 50, y: Math.floor(index / 3) * 100 + 50 });
  const first = line ? point(line[0]) : null;
  const last = line ? point(line[2]) : null;
  const lockedCell = (boardIndex: number) => disabled || status !== "playing" || (activeBoard !== null && activeBoard !== boardIndex);
  return <div className={`board-arena ${status === "draw" ? "arena-draw" : ""} ${winner ? `arena-${winner.toLowerCase()}` : ""} ${disabled ? "board-idle" : ""}`}>
    <span className="arena-corner corner-one" aria-hidden="true" /><span className="arena-corner corner-two" aria-hidden="true" />
    <div className="board-grid" role="group" aria-label="لوحة اللعب، تسع لوحات فرعية" dir="ltr">
      {boards.map((mini, boardIndex) => mini.mark !== null
        ? <div key={boardIndex} className={`mini-cover cover-done ${mini.mark === "D" ? "cover-draw" : `cover-${mini.mark.toLowerCase()}`}`} role="group" aria-label={`اللوحة ${boardIndex + 1}: ${mini.mark === "D" ? "تعادل" : `فاز بالرمز ${mini.mark}`}`}>
          {mini.mark === "D" ? <span className="cover-equal" aria-hidden="true">=</span> : <PlayerSymbol player={mini.mark} animated={false} />}
        </div>
        : <div key={boardIndex} className={`mini-board ${status === "playing" && activeBoard === boardIndex && !disabled ? "mini-active" : ""} ${lockedCell(boardIndex) ? "mini-locked" : ""}`}>
          <div className="mini-grid" role="group" aria-label={`اللوحة الفرعية ${boardIndex + 1}`} dir="ltr">
            {mini.cells.map((value, cell) => <GameCell key={cell} board={boardIndex} cell={cell} value={value} locked={lockedCell(boardIndex)} onSelect={onSelect} />)}
          </div>
        </div>)}
    </div>
    {first && last ? <svg className={`winning-line text-${winner?.toLowerCase()}`} viewBox="0 0 300 300" aria-hidden="true"><motion.line x1={first.x} y1={first.y} x2={last.x} y2={last.y} stroke="currentColor" strokeWidth="5" strokeLinecap="round" initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.12 }} /></svg> : null}
    {winner && !reduced ? <div className={`celebration text-${winner.toLowerCase()}`} aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <motion.i key={index} initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }} animate={{ x: Math.cos(index * Math.PI / 6) * 155, y: Math.sin(index * Math.PI / 6) * 155, opacity: 0, scale: 1.2 }} transition={{ duration: 0.8, delay: 0.1 }} />)}</div> : null}
  </div>;
}