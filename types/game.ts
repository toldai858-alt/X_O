export type Player = "X" | "O";
export type CellValue = Player | null;
export type Board = [CellValue, CellValue, CellValue, CellValue, CellValue, CellValue, CellValue, CellValue, CellValue];
export type WinningLine = readonly [number, number, number];
export type GameStatus = "playing" | "won" | "draw";
export type Theme = "cosmic" | "sunset" | "ice";
export type MiniMark = Player | "D" | null;
export interface MiniBoard {
  cells: Board;
  mark: MiniMark;
}
export type BigBoard = readonly MiniBoard[];

export interface GameSettings {
  names: Record<Player, string>;
  sound: boolean;
  haptics: boolean;
  theme: Theme;
}

export interface GameStats {
  totalRounds: number;
  wins: Record<Player, number>;
  draws: number;
  streak: { player: Player | null; count: number };
  bestStreak: { player: Player | null; count: number };
}

export interface MatchState {
  boards: BigBoard;
  activeBoard: number | null;
  currentPlayer: Player;
  startingPlayer: Player;
  status: GameStatus;
  winner: Player | null;
  round: number;
  scores: Record<Player, number>;
}

export interface GameState {
  screen: "start" | "game";
  match: MatchState;
  stats: GameStats;
}

export type GameAction =
  | { type: "hydrate"; stats: GameStats }
  | { type: "start" }
  | { type: "leave" }
  | { type: "move"; board: number; cell: number }
  | { type: "next" }
  | { type: "reset-match" }
  | { type: "reset-stats" };

export type OnlineError = "not-found" | "full" | "ended";

export type ClientMessage =
  | { t: "create"; playerId: string; name: string }
  | { t: "join"; room: string; playerId: string; name: string }
  | { t: "move"; board: number; cell: number }
  | { t: "next" }
  | { t: "reset" }
  | { t: "leave" }
  | { t: "ping" };

export type ServerMessage =
  | { t: "init"; room: string; player: Player; players: Record<Player, string>; match: MatchState }
  | { t: "state"; players: Record<Player, string>; match: MatchState }
  | { t: "ready" }
  | { t: "partner-left" }
  | { t: "error"; code: OnlineError; message: string }
  | { t: "pong" };
