import { EMPTY_STATS, WINNING_LINES } from "./constants.ts";
import type { Board, GameAction, GameState, GameStats, GameStatus, MatchState, MiniBoard, MiniMark, Player, WinningLine } from "@/types/game";

export const otherPlayer = (player: Player): Player => player === "X" ? "O" : "X";
export const createBoard = (): Board => [null, null, null, null, null, null, null, null, null];
export const createMiniBoard = (): MiniBoard => ({ cells: createBoard(), mark: null });

export function getWinningLine(board: Board): WinningLine | null {
  return WINNING_LINES.find(([a, b, c]) => board[a] !== null && board[a] === board[b] && board[a] === board[c]) ?? null;
}
export function checkWinner(board: Board): Player | null {
  const line = getWinningLine(board);
  return line ? board[line[0]] : null;
}
export function isBoardFull(board: Board): boolean {
  return board.every(cell => cell !== null);
}
export function getMetaLine(marks: readonly MiniMark[]): WinningLine | null {
  return WINNING_LINES.find(([a, b, c]) => marks[a] !== null && marks[a] !== "D" && marks[a] === marks[b] && marks[a] === marks[c]) ?? null;
}
export function getNextStartingPlayer(previousStarter: Player, winner: Player | null): Player {
  return otherPlayer(winner ?? previousStarter);
}
export function createMatch(): MatchState {
  return {
    boards: Array.from({ length: 9 }, createMiniBoard),
    activeBoard: null,
    currentPlayer: "X",
    startingPlayer: "X",
    status: "playing",
    winner: null,
    round: 1,
    scores: { X: 0, O: 0 },
  };
}
export function createGame(): GameState {
  return { screen: "start", match: createMatch(), stats: EMPTY_STATS };
}
export function isMatchEmpty(match: MatchState): boolean {
  return match.boards.every(mini => mini.cells.every(cell => cell === null));
}
export function recordResult(stats: GameStats, winner: Player | null): GameStats {
  const streak = winner
    ? { player: winner, count: stats.streak.player === winner ? stats.streak.count + 1 : 1 }
    : { player: null, count: 0 };
  return {
    totalRounds: stats.totalRounds + 1,
    wins: { X: stats.wins.X + Number(winner === "X"), O: stats.wins.O + Number(winner === "O") },
    draws: stats.draws + Number(winner === null),
    streak,
    bestStreak: streak.count > stats.bestStreak.count ? streak : stats.bestStreak,
  };
}
export function playMove(match: MatchState, board: number, cell: number): MatchState | null {
  if (match.status !== "playing") return null;
  if (!Number.isInteger(board) || board < 0 || board > 8 || !Number.isInteger(cell) || cell < 0 || cell > 8) return null;
  if (match.activeBoard !== null && match.activeBoard !== board) return null;
  const mini = match.boards[board];
  if (mini.mark !== null || mini.cells[cell] !== null) return null;
  const boards = match.boards.map(copy => ({ cells: [...copy.cells] as Board, mark: copy.mark }));
  const cells = boards[board].cells;
  cells[cell] = match.currentPlayer;
  const miniWinner = checkWinner(cells);
  const mark: MiniMark = miniWinner ?? (isBoardFull(cells) ? "D" : null);
  boards[board] = { cells, mark };
  const marks = boards.map(copy => copy.mark);
  const metaLine = getMetaLine(marks);
  const winner: Player | null = (() => {
    if (!metaLine) return null;
    const value = marks[metaLine[0]];
    return value === "X" || value === "O" ? value : null;
  })();
  const status: GameStatus = winner ? "won" : marks.every(copy => copy !== null) ? "draw" : "playing";
  const activeBoard = status === "playing" ? (marks[cell] === null ? cell : null) : match.activeBoard;
  return {
    ...match, boards, winner, status, activeBoard,
    currentPlayer: status === "playing" ? otherPlayer(match.currentPlayer) : match.currentPlayer,
    scores: winner ? { ...match.scores, [winner]: match.scores[winner] + 1 } : match.scores,
  };
}

export function nextMatch(match: MatchState): MatchState {
  const completed = match.status !== "playing";
  const starter = completed ? getNextStartingPlayer(match.startingPlayer, match.winner) : match.startingPlayer;
  const fresh = createMatch();
  return { ...fresh, scores: match.scores, startingPlayer: starter, currentPlayer: starter, round: match.round + Number(completed) };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  const match = state.match;
  switch (action.type) {
    case "hydrate": return { ...state, stats: action.stats };
    case "start": return { ...state, screen: "game", match: createMatch() };
    case "leave": return { ...state, screen: "start", match: createMatch() };
    case "reset-match": return { ...state, match: createMatch() };
    case "reset-stats": return { ...state, stats: EMPTY_STATS };
    case "next": return { ...state, match: nextMatch(match) };
    case "move": {
      if (state.screen !== "game") return state;
      const updated = playMove(match, action.board, action.cell);
      if (!updated) return state;
      const completed = updated.status !== "playing";
      return {
        ...state,
        stats: completed ? recordResult(state.stats, updated.winner) : state.stats,
        match: updated,
      };
    }
  }
}