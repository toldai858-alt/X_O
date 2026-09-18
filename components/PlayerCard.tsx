import { PlayerSymbol } from "@/components/PlayerSymbol";
import { formatNumber } from "@/lib/utils";
import type { Player } from "@/types/game";

export function PlayerCard({ player, name, wins, active }: { player: Player; name: string; wins: number; active: boolean }) {
  return <div className={`player-card player-${player.toLowerCase()} ${active ? "is-active" : ""}`}>
    <div className="player-card-top"><PlayerSymbol player={player} animated={false} /><strong>{formatNumber(wins)}</strong></div>
    <div className="player-name" title={name}><span className="active-dot" />{name}</div>
    <span className="player-caption">انتصارات المباراة</span>
  </div>;
}
