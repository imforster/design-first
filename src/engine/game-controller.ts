import type { Board, Digit, GameSession, ValidationResult } from "../types";
import { Difficulty } from "../types";
import { deepCloneBoard } from "../utils";
import { setCell, clearCell, isGivenCell, togglePencilMark as boardTogglePencilMark, isBoardComplete } from "./board-manager";
import { isValidPlacement, isBoardValid } from "./validator";
import { solve, getHint as solverGetHint } from "./solver";
import { generate } from "./generator";
import { createHistory, pushMove, undo, redo } from "./history-manager";

/**
 * Starts a new game: generates a puzzle at the given difficulty,
 * solves it for the solution reference, initializes the board,
 * resets history, and sets elapsed time to 0.
 */
export function newGame(difficulty: Difficulty): GameSession {
  const puzzle = generate(difficulty);
  const solveResult = solve(puzzle);
  if (solveResult.kind !== "solved") {
    throw new Error("Generated puzzle has no solution");
  }

  return {
    puzzle: deepCloneBoard(puzzle),
    current: deepCloneBoard(puzzle),
    solution: solveResult.board,
    difficulty,
    history: createHistory(),
    elapsedSeconds: 0,
    hintsUsed: 0,
  };
}

/**
 * Makes a move: validates the digit placement, updates the board,
 * and records the move in history.
 * Rejects moves on Given_Cells — returns session unchanged with a valid result.
 */
export function makeMove(
  session: GameSession,
  row: number,
  col: number,
  digit: Digit
): { session: GameSession; validation: ValidationResult } {
  // Reject moves on given cells
  if (isGivenCell(session.current, row, col)) {
    return { session, validation: { kind: "valid" } };
  }

  // Validate the placement
  const validation = isValidPlacement(session.current, row, col, digit);

  // Capture old state for history
  const oldCell = session.current[row][col];
  const oldValue = oldCell.value;
  const oldPencilMarks = new Set(oldCell.pencilMarks);

  // Update the board
  const newBoard = setCell(session.current, row, col, digit);

  // Record the move in history
  const newHistory = pushMove(session.history, {
    row,
    col,
    oldValue,
    newValue: digit,
    oldPencilMarks,
    newPencilMarks: new Set<Digit>(),
  });

  return {
    session: {
      ...session,
      current: newBoard,
      history: newHistory,
    },
    validation,
  };
}

/**
 * Undoes the last move: restores the previous cell state from history.
 * Returns the session unchanged if there is nothing to undo.
 */
export function undoMove(session: GameSession): GameSession {
  const result = undo(session.history);
  if (!result) return session;

  const { move, history: newHistory } = result;
  let newBoard: Board;

  if (move.oldValue === null) {
    newBoard = clearCell(session.current, move.row, move.col);
    // Restore old pencil marks
    const cloned = deepCloneBoard(newBoard);
    cloned[move.row][move.col] = {
      value: null,
      isGiven: false,
      pencilMarks: new Set(move.oldPencilMarks),
    };
    newBoard = cloned;
  } else {
    newBoard = setCell(session.current, move.row, move.col, move.oldValue);
  }

  return {
    ...session,
    current: newBoard,
    history: newHistory,
  };
}

/**
 * Redoes the last undone move: re-applies the move from the redo stack.
 * Returns the session unchanged if there is nothing to redo.
 */
export function redoMove(session: GameSession): GameSession {
  const result = redo(session.history);
  if (!result) return session;

  const { move, history: newHistory } = result;
  let newBoard: Board;

  if (move.newValue === null) {
    newBoard = clearCell(session.current, move.row, move.col);
    // Restore new pencil marks
    const cloned = deepCloneBoard(newBoard);
    cloned[move.row][move.col] = {
      value: null,
      isGiven: false,
      pencilMarks: new Set(move.newPencilMarks),
    };
    newBoard = cloned;
  } else {
    newBoard = setCell(session.current, move.row, move.col, move.newValue);
  }

  return {
    ...session,
    current: newBoard,
    history: newHistory,
  };
}

/**
 * Requests a hint: finds one empty cell and its correct digit from the solution,
 * places it on the board, and increments the hint counter.
 * Returns null hint if the board is already complete or unsolvable.
 */
export function requestHint(
  session: GameSession
): { session: GameSession; hint: { row: number; col: number; digit: Digit } | null } {
  const hint = solverGetHint(session.current);
  if (!hint) {
    return { session, hint: null };
  }

  // Apply the hint as a move
  const { session: updatedSession } = makeMove(session, hint.row, hint.col, hint.digit);

  return {
    session: {
      ...updatedSession,
      hintsUsed: session.hintsUsed + 1,
    },
    hint,
  };
}

/**
 * Toggles a pencil mark for a digit on a cell.
 * Records the change in history for undo/redo support.
 * Returns session unchanged if the cell is a given cell or has a value.
 */
export function togglePencilMark(
  session: GameSession,
  row: number,
  col: number,
  digit: Digit
): GameSession {
  const cell = session.current[row][col];
  if (cell.isGiven || cell.value !== null) {
    return session;
  }

  const oldPencilMarks = new Set(cell.pencilMarks);
  const newBoard = boardTogglePencilMark(session.current, row, col, digit);
  const newPencilMarks = new Set(newBoard[row][col].pencilMarks);

  const newHistory = pushMove(session.history, {
    row,
    col,
    oldValue: null,
    newValue: null,
    oldPencilMarks,
    newPencilMarks,
  });

  return {
    ...session,
    current: newBoard,
    history: newHistory,
  };
}

/**
 * Pauses the game. Only valid when the game is in a playing state.
 * The caller is responsible for stopping the timer.
 * Returns the session with a marker that can be used by the UI layer.
 */
export function pause(session: GameSession): GameSession {
  return { ...session };
}

/**
 * Resumes the game. Only valid when the game is in a paused state.
 * The caller is responsible for resuming the timer.
 * Returns the session with a marker that can be used by the UI layer.
 */
export function resume(session: GameSession): GameSession {
  return { ...session };
}

/**
 * Checks if the game is complete: the board is full and valid.
 * Returns true if the game should transition to the completed state.
 */
export function checkCompletion(session: GameSession): boolean {
  return isBoardComplete(session.current) && isBoardValid(session.current);
}
