import { describe, expect, it } from "vitest";
import { EMPTY_STATS, WINNING_LINES } from "@/lib/constants";
import { checkWinner, createBoard, createGame, createMatch, createMiniBoard, gameReducer, getMetaLine, getNextStartingPlayer, getWinningLine, isBoardFull, isMatchEmpty, recordResult } from "@/lib/gameLogic";
import type { Board, GameState, MiniBoard, MiniMark, Player } from "@/types/game";

const play = (moves: [number, number][], state: GameState = gameReducer(createGame(), { type: "start" })) => moves.reduce((current, [board, cell]) => gameReducer(current, { type: "move", board, cell }), state);

const MINI_ZERO_X_WIN: [number, number][] = [
  [0, 0], [0, 1], [1, 3], [3, 0], [0, 4], [4, 0], [0, 8],
];

const BIG_X_DIAG_WIN: [number, number][] = [
  ...MINI_ZERO_X_WIN,
  [8, 2], [2, 0],
  [7, 4],
  [4, 1], [1, 4], [4, 4], [4, 6], [6, 0],
  [8, 3], [3, 8], [8, 4], [4, 7],
  [7, 2], [2, 5], [5, 6], [6, 4],
  [5, 8], [8, 1], [1, 8], [8, 7], [7, 5], [5, 4],
  [7, 8], [8, 6], [6, 8], [8, 8],
];

const withBoards = (assign: (boards: MiniBoard[]) => void): GameState => {
  const match = createMatch();
  const boards = Array.from({ length: 9 }, createMiniBoard);
  assign(boards);
  return { screen: "game", match: { ...match, boards, activeBoard: null }, stats: EMPTY_STATS };
};
const fillCells = (cells: (Player | null)[]): Board => cells.slice(0, 9).concat(Array(9).fill(null)).slice(0, 9) as Board;

describe("single board helpers", () => {
  for (const player of ["X", "O"] as Player[]) {
    WINNING_LINES.forEach((line, index) => {
      it(`detects ${player} on line ${index + 1}`, () => {
        const board = createBoard();
        line.forEach(cell => { board[cell] = player; });
        expect(checkWinner(board)).toBe(player);
        expect(getWinningLine(board)).toEqual(line);
      });
    });
  }
  it("does not mark an empty board as won or full", () => {
    expect(checkWinner(createBoard())).toBeNull();
    expect(isBoardFull(createBoard())).toBe(false);
    expect(getWinningLine(createBoard())).toBeNull();
  });
});

describe("meta board line", () => {
  it("detects a player line and ignores draw cells", () => {
    const marks: MiniMark[] = [null, null, null, null, null, null, "X", "X", "X"];
    expect(getMetaLine(marks)).toEqual([6, 7, 8]);
    const withDraw: MiniMark[] = ["D", "D", "D", null, null, null, null, null, null];
    expect(getMetaLine(withDraw)).toBeNull();
    const empty: MiniMark[] = Array(9).fill(null);
    expect(getMetaLine(empty)).toBeNull();
  });
});

describe("match transitions", () => {
  it("starts with X, an open board and rejects invalid moves", () => {
    const initial = gameReducer(createGame(), { type: "start" });
    expect(initial.match.currentPlayer).toBe("X");
    expect(initial.match.activeBoard).toBeNull();
    expect(isMatchEmpty(initial.match)).toBe(true);
    for (const move of [[-1, 0] as const, [9, 0] as const, [1.5, 0] as const, [0, 9] as const, [NaN, 0] as const, [0, NaN] as const]) {
      expect(gameReducer(initial, { type: "move", board: move[0], cell: move[1] })).toBe(initial);
    }
    const state = play([[0, 0]], initial);
    expect(state.match.currentPlayer).toBe("O");
    expect(state.match.activeBoard).toBe(0);
    expect(isMatchEmpty(state.match)).toBe(false);
    expect(gameReducer(state, { type: "move", board: 1, cell: 0 })).toBe(state);
    expect(gameReducer(state, { type: "move", board: 0, cell: 0 })).toBe(state);
  });
  it("forces the next move into the mini board matching the played cell", () => {
    const state = play([[0, 4], [4, 2], [2, 0]]);
    expect(state.match.boards[4].cells[2]).toBe("O");
    expect(state.match.activeBoard).toBe(0);
  });
  it("grants free choice when the cell points to a decided mini board", () => {
    const state = play([...MINI_ZERO_X_WIN, [8, 2], [2, 0]]);
    expect(state.match.boards[2].cells[0]).toBe("X");
    expect(state.match.activeBoard).toBeNull();
    expect(state.match.currentPlayer).toBe("O");
  });
  it("marks a won mini board and locks it from further play", () => {
    const state = play(MINI_ZERO_X_WIN);
    expect(state.match.boards[0].mark).toBe("X");
    expect(state.match.boards[0].cells[0]).toBe("X");
    expect(state.match.boards[0].cells[4]).toBe("X");
    expect(state.match.boards[0].cells[8]).toBe("X");
    expect(state.match.status).toBe("playing");
    expect(state.match.activeBoard).toBe(8);
    expect(gameReducer(state, { type: "move", board: 0, cell: 3 })).toBe(state);
  });
  it("wins the big board, records the score once and locks everything", () => {
    const state = play(BIG_X_DIAG_WIN);
    expect(state.match.status).toBe("won");
    expect(state.match.winner).toBe("X");
    expect([0, 4, 8].map(index => state.match.boards[index].mark)).toEqual(["X", "X", "X"]);
    expect(state.match.scores).toEqual({ X: 1, O: 0 });
    expect(state.stats.totalRounds).toBe(1);
    const ignored = gameReducer(state, { type: "move", board: 0, cell: 0 });
    expect(ignored).toBe(state);
  });
  it("declares a draw when every mini board is decided without a big line", () => {
    const state = withBoards(boards => {
      const marks: MiniMark[] = ["X", "O", "D", "O", "X", "D", "D", "X", null];
      marks.forEach((mark, index) => { if (mark !== null) boards[index] = { cells: createBoard(), mark }; });
      const last: Board = fillCells(["X", "O", "X", "X", "O", "O", "O", "X", null]);
      boards[8] = { cells: last, mark: null };
    });
    const drawn = gameReducer(state, { type: "move", board: 8, cell: 8 });
    expect(drawn.match.status).toBe("draw");
    expect(drawn.match.winner).toBeNull();
    expect(drawn.stats.draws).toBe(1);
    expect(drawn.match.scores).toEqual({ X: 0, O: 0 });
  });
  it("records a constructed win exactly once and lets the loser start next", () => {
    const nearWin = withBoards(boards => {
      boards[0] = { cells: createBoard(), mark: "X" };
      boards[4] = { cells: createBoard(), mark: "X" };
      const last = createBoard();
      last[0] = "X";
      last[1] = "X";
      boards[8] = { cells: last, mark: null };
    });
    const won = play([[8, 2]], nearWin);
    expect(won.match.status).toBe("won");
    const next = gameReducer(won, { type: "next" });
    expect(next.match.startingPlayer).toBe("O");
    expect(next.match.currentPlayer).toBe("O");
    expect(next.match.round).toBe(2);
    expect(next.match.scores.X).toBe(1);
    expect(isMatchEmpty(next.match)).toBe(true);
    expect(getNextStartingPlayer("O", null)).toBe("X");
  });
  it("resets or abandons a match without deleting lifetime statistics", () => {
    const state = play(BIG_X_DIAG_WIN);
    for (const type of ["reset-match", "leave"] as const) {
      const next = gameReducer(state, { type });
      expect(next.stats).toEqual(state.stats);
      expect(next.match.scores).toEqual({ X: 0, O: 0 });
      expect(next.match.round).toBe(1);
      expect(next.match.startingPlayer).toBe("X");
      expect(isMatchEmpty(next.match)).toBe(true);
    }
  });
  it("clears stats separately and does not recount a finished match", () => {
    const state = gameReducer(play(BIG_X_DIAG_WIN), { type: "reset-stats" });
    expect(state.stats.totalRounds).toBe(0);
    expect(gameReducer(state, { type: "move", board: 0, cell: 0 }).stats.totalRounds).toBe(0);
  });
  it("tracks streaks across wins and breaks them on a draw or opponent win", () => {
    const twice = recordResult(recordResult(EMPTY_STATS, "X"), "X");
    expect(twice.streak).toEqual({ player: "X", count: 2 });
    const draw = recordResult(twice, null);
    expect(draw.streak).toEqual({ player: null, count: 0 });
    expect(draw.bestStreak).toEqual({ player: "X", count: 2 });
    expect(recordResult(twice, "O").streak).toEqual({ player: "O", count: 1 });
  });
});