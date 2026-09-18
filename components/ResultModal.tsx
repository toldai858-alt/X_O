import { Crown, Trophy } from "lucide-react";
import { PlayerSymbol } from "@/components/PlayerSymbol";
import { Sheet } from "@/components/Sheet";
import { VICTORY_MESSAGES } from "@/lib/constants";
import type { Player } from "@/types/game";

export function ResultModal({ open, winner, name, round, onClose, onNext, onReset }: { open: boolean; winner: Player | null; name: string; round: number; onClose: () => void; onNext: () => void; onReset: () => void }) {
  return <Sheet open={open} title={winner ? "انتصار ساحق!" : "تعادل ذكي"} titleId="result-title" onClose={onClose} compact>
    <div className={`result-emblem ${winner ? `text-${winner.toLowerCase()}` : ""}`}>{winner ? <><PlayerSymbol player={winner} /><Crown className="result-crown" size={54} aria-hidden="true" /></> : <span aria-hidden="true">=</span>}<Trophy className="result-trophy" size={21} /></div>
    <div className="result-copy">{winner ? <h3>{name}</h3> : null}<p>{winner ? VICTORY_MESSAGES[(round - 1) % VICTORY_MESSAGES.length] : "كلاكما أغلق الساحة بإتقان."}</p></div>
    <div className="sheet-actions"><button className="button button-primary" onClick={onNext}>الجولة التالية</button><button className="button button-secondary" onClick={onReset}>إعادة المباراة</button></div>
  </Sheet>;
}
