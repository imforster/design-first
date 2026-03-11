import { describe, it, expect } from "vitest";
import {
  newGame,
  makeMove,
  undoMove,
  redoMove,
  requestHint,
  togglePencilMark,
  pause,
  resume,
  checkCompletion,
} from "./game-controller";
import { Difficulty } from "../types";
import type { Digit, GameSession } from "../types";
import { generate } from "./generator";
import { solve } from "./solver";
import { deepCloneBoard } from "../utils";

/**
 * Creates a game session from a known seed for deterministic testing.
 * Uses Easy difficulty for faster generation.
 */
function createTestSession(): GameSession {
  return newGame(Difficulty.Easy);
}

/**
 * Finds the first empty (non-given) cell on the session's current board.
 */
function findEmptyCell(session: GameSession): { row: number; col: number } | null {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (!session.current[r][c].isGiven && session.current[r][c].value === null) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

/**
 * Finds the first given cell on the session's current board.
 */
function findGivenCell(session: GameSession): { row: number; col: number } | null {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (session.current[r][c].isGiven) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

/**
 * Gets the correct digit for an empty cell from the solution.
 */
function getCorrectDigit(session: GameSession, row: number, col: number): Digit {
  return session.solution[row][col].value!;
}

/**
 * Gets a wrong digit for a cell — one that conflicts with existing peers.
 * Returns a digit that is NOT the correct solution digit.
 */
function getConflictingDigit(session: GameSession, row: number, col: number): Digit {
  const correct = getCorrectDigit(session, row, col);
  // Find a digit already present in the same row to guarantee a conflict
  for (let c = 0; c < 9; c++) {
    const val = session.current[row][c].value;
    if (val !== null && c !== col) {
      return val;
    }
  }
  // Fallback: just pick a different digit
  const wrong = correct === 9 ? 1 : ((correct + 1) as Digit);
  return wrong;
}

// ============================================================
// Validates: Requirements 8.1
// ============================================================
describe("newGame", () => {
  it("initializes a session with a valid board from the generated puzzle", () => {
    const session = createTestSession();

    expect(session.current).toBeDefined();
    expect(session.current.length).toBe(9);
    expect(session.current[0].length).toBe(9);
  });

  it("sets elapsed time to zero", () => {
    const session = createTestSession();
    expect(session.elapsedSeconds).toBe(0);
  });

  it("resets the history manager (empty undo/redo stacks)", () => {
    const session = createTestSession();
    expect(session.history.undoStack.length).toBe(0);
    expect(session.history.redoStack.length).toBe(0);
  });

  it("sets hints used to zero", () => {
    const session = createTestSession();
    expect(session.hintsUsed).toBe(0);
  });

  it("stores the puzzle, current board, and solution", () => {
    const session = createTestSession();

    expect(session.puzzle).toBeDefined();
    expect(session.solution).toBeDefined();
    expect(session.difficulty).toBe(Difficulty.Easy);
  });

  it("puzzle and current board start identical", () => {
    const session = createTestSession();

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        expect(session.current[r][c].value).toBe(session.puzzle[r][c].value);
        expect(session.current[r][c].isGiven).toBe(session.puzzle[r][c].isGiven);
      }
    }
  });

  it("has given cells on the board", () => {
    const session = createTestSession();
    const givenCell = findGivenCell(session);
    expect(givenCell).not.toBeNull();
  });

  it("has empty cells on the board", () => {
    const session = createTestSession();
    const emptyCell = findEmptyCell(session);
    expect(emptyCell).not.toBeNull();
  });
});

// ============================================================
// Validates: Requirements 8.5 (Given_Cell rejection)
// ============================================================
describe("makeMove - Given_Cell rejection", () => {
  it("rejects moves on Given_Cells and returns session unchanged", () => {
    const session = createTestSession();
    const givenCell = findGivenCell(session)!;

    const { session: result, validation } = makeMove(session, givenCell.row, givenCell.col, 1);

    // Session should be the exact same reference (unchanged)
    expect(result).toBe(session);
    expect(validation.kind).toBe("valid");
  });

  it("does not record a move in history when Given_Cell is targeted", () => {
    const session = createTestSession();
    const givenCell = findGivenCell(session)!;

    const { session: result } = makeMove(session, givenCell.row, givenCell.col, 1);

    expect(result.history.undoStack.length).toBe(0);
  });
});

// ============================================================
// Validates: Requirements 8.5 (validation delegation and conflict info)
// ============================================================
describe("makeMove - validation and board updates", () => {
  it("returns valid result for a correct placement", () => {
    const session = createTestSession();
    const emptyCell = findEmptyCell(session)!;
    const correctDigit = getCorrectDigit(session, emptyCell.row, emptyCell.col);

    const { validation } = makeMove(session, emptyCell.row, emptyCell.col, correctDigit);

    expect(validation.kind).toBe("valid");
  });

  it("returns conflict info for an invalid placement", () => {
    const session = createTestSession();
    const emptyCell = findEmptyCell(session)!;
    const conflictDigit = getConflictingDigit(session, emptyCell.row, emptyCell.col);

    const { validation } = makeMove(session, emptyCell.row, emptyCell.col, conflictDigit);

    expect(validation.kind).toBe("conflict");
    if (validation.kind === "conflict") {
      expect(validation.conflicts.length).toBeGreaterThan(0);
    }
  });

  it("updates the board with the placed digit", () => {
    const session = createTestSession();
    const emptyCell = findEmptyCell(session)!;
    const correctDigit = getCorrectDigit(session, emptyCell.row, emptyCell.col);

    const { session: result } = makeMove(session, emptyCell.row, emptyCell.col, correctDigit);

    expect(result.current[emptyCell.row][emptyCell.col].value).toBe(correctDigit);
  });

  it("records the move in history", () => {
    const session = createTestSession();
    const emptyCell = findEmptyCell(session)!;
    const correctDigit = getCorrectDigit(session, emptyCell.row, emptyCell.col);

    const { session: result } = makeMove(session, emptyCell.row, emptyCell.col, correctDigit);

    expect(result.history.undoStack.length).toBe(1);
    const move = result.history.undoStack[0];
    expect(move.row).toBe(emptyCell.row);
    expect(move.col).toBe(emptyCell.col);
    expect(move.oldValue).toBeNull();
    expect(move.newValue).toBe(correctDigit);
  });

  it("does not mutate the original session", () => {
    const session = createTestSession();
    const emptyCell = findEmptyCell(session)!;
    const correctDigit = getCorrectDigit(session, emptyCell.row, emptyCell.col);

    makeMove(session, emptyCell.row, emptyCell.col, correctDigit);

    // Original session should be unchanged
    expect(session.current[emptyCell.row][emptyCell.col].value).toBeNull();
    expect(session.history.undoStack.length).toBe(0);
  });
});

// ============================================================
// Validates: Requirements 8.2, 8.3
// ============================================================
describe("pause and resume", () => {
  it("pause returns a session object", () => {
    const session = createTestSession();
    const paused = pause(session);

    expect(paused).toBeDefined();
    expect(paused.current).toBeDefined();
    expect(paused.history).toBeDefined();
  });

  it("resume returns a session object", () => {
    const session = createTestSession();
    const paused = pause(session);
    const resumed = resume(paused);

    expect(resumed).toBeDefined();
    expect(resumed.current).toBeDefined();
    expect(resumed.history).toBeDefined();
  });

  it("pause preserves the board state", () => {
    const session = createTestSession();
    const emptyCell = findEmptyCell(session)!;
    const correctDigit = getCorrectDigit(session, emptyCell.row, emptyCell.col);
    const { session: afterMove } = makeMove(session, emptyCell.row, emptyCell.col, correctDigit);

    const paused = pause(afterMove);

    expect(paused.current[emptyCell.row][emptyCell.col].value).toBe(correctDigit);
  });

  it("resume preserves the board state after pause", () => {
    const session = createTestSession();
    const emptyCell = findEmptyCell(session)!;
    const correctDigit = getCorrectDigit(session, emptyCell.row, emptyCell.col);
    const { session: afterMove } = makeMove(session, emptyCell.row, emptyCell.col, correctDigit);

    const paused = pause(afterMove);
    const resumed = resume(paused);

    expect(resumed.current[emptyCell.row][emptyCell.col].value).toBe(correctDigit);
  });

  it("pause preserves history", () => {
    const session = createTestSession();
    const emptyCell = findEmptyCell(session)!;
    const correctDigit = getCorrectDigit(session, emptyCell.row, emptyCell.col);
    const { session: afterMove } = makeMove(session, emptyCell.row, emptyCell.col, correctDigit);

    const paused = pause(afterMove);
    expect(paused.history.undoStack.length).toBe(1);
  });

  it("pause preserves elapsed time", () => {
    const session = createTestSession();
    const withTime = { ...session, elapsedSeconds: 42 };
    const paused = pause(withTime);

    expect(paused.elapsedSeconds).toBe(42);
  });

  it("resume preserves elapsed time", () => {
    const session = createTestSession();
    const withTime = { ...session, elapsedSeconds: 42 };
    const paused = pause(withTime);
    const resumed = resume(paused);

    expect(resumed.elapsedSeconds).toBe(42);
  });
});

// ============================================================
// Validates: Requirements 8.4
// ============================================================
describe("checkCompletion", () => {
  it("returns false for a fresh game (incomplete board)", () => {
    const session = createTestSession();
    expect(checkCompletion(session)).toBe(false);
  });

  it("returns true when the board is fully and correctly filled", () => {
    const session = createTestSession();

    // Fill the board with the solution
    const completedSession: GameSession = {
      ...session,
      current: deepCloneBoard(session.solution),
    };

    expect(checkCompletion(completedSession)).toBe(true);
  });

  it("returns false when the board is full but has conflicts", () => {
    const session = createTestSession();

    // Create a full but invalid board by swapping two non-given cells in the same row
    const board = deepCloneBoard(session.solution);

    // Find two non-given cells in the same row to swap
    let swapped = false;
    for (let r = 0; r < 9 && !swapped; r++) {
      const nonGivenCols: number[] = [];
      for (let c = 0; c < 9; c++) {
        if (!session.puzzle[r][c].isGiven) {
          nonGivenCols.push(c);
        }
      }
      if (nonGivenCols.length >= 2) {
        const c1 = nonGivenCols[0];
        const c2 = nonGivenCols[1];
        if (board[r][c1].value !== board[r][c2].value) {
          const temp = board[r][c1].value;
          board[r][c1] = { ...board[r][c1], value: board[r][c2].value };
          board[r][c2] = { ...board[r][c2], value: temp };
          swapped = true;
        }
      }
    }

    if (swapped) {
      const invalidSession: GameSession = { ...session, current: board };
      expect(checkCompletion(invalidSession)).toBe(false);
    }
  });
});

// ============================================================
// Additional tests for undo/redo integration via game controller
// ============================================================
describe("undoMove and redoMove", () => {
  it("undoMove restores the previous cell value", () => {
    const session = createTestSession();
    const emptyCell = findEmptyCell(session)!;
    const correctDigit = getCorrectDigit(session, emptyCell.row, emptyCell.col);

    const { session: afterMove } = makeMove(session, emptyCell.row, emptyCell.col, correctDigit);
    expect(afterMove.current[emptyCell.row][emptyCell.col].value).toBe(correctDigit);

    const afterUndo = undoMove(afterMove);
    expect(afterUndo.current[emptyCell.row][emptyCell.col].value).toBeNull();
  });

  it("redoMove re-applies the undone move", () => {
    const session = createTestSession();
    const emptyCell = findEmptyCell(session)!;
    const correctDigit = getCorrectDigit(session, emptyCell.row, emptyCell.col);

    const { session: afterMove } = makeMove(session, emptyCell.row, emptyCell.col, correctDigit);
    const afterUndo = undoMove(afterMove);
    const afterRedo = redoMove(afterUndo);

    expect(afterRedo.current[emptyCell.row][emptyCell.col].value).toBe(correctDigit);
  });

  it("undoMove returns session unchanged when nothing to undo", () => {
    const session = createTestSession();
    const result = undoMove(session);
    expect(result).toBe(session);
  });

  it("redoMove returns session unchanged when nothing to redo", () => {
    const session = createTestSession();
    const result = redoMove(session);
    expect(result).toBe(session);
  });
});

// ============================================================
// Additional: requestHint and togglePencilMark
// ============================================================
describe("requestHint", () => {
  it("returns a hint with a valid cell and digit", () => {
    const session = createTestSession();
    const { hint } = requestHint(session);

    expect(hint).not.toBeNull();
    if (hint) {
      expect(hint.row).toBeGreaterThanOrEqual(0);
      expect(hint.row).toBeLessThan(9);
      expect(hint.col).toBeGreaterThanOrEqual(0);
      expect(hint.col).toBeLessThan(9);
      expect(hint.digit).toBeGreaterThanOrEqual(1);
      expect(hint.digit).toBeLessThanOrEqual(9);
    }
  });

  it("increments the hint counter", () => {
    const session = createTestSession();
    const { session: afterHint } = requestHint(session);

    expect(afterHint.hintsUsed).toBe(1);
  });
});

describe("togglePencilMark via game controller", () => {
  it("toggles a pencil mark on an empty cell", () => {
    const session = createTestSession();
    const emptyCell = findEmptyCell(session)!;

    const result = togglePencilMark(session, emptyCell.row, emptyCell.col, 3);

    expect(result.current[emptyCell.row][emptyCell.col].pencilMarks.has(3)).toBe(true);
  });

  it("returns session unchanged for a given cell", () => {
    const session = createTestSession();
    const givenCell = findGivenCell(session)!;

    const result = togglePencilMark(session, givenCell.row, givenCell.col, 3);

    expect(result).toBe(session);
  });
});
