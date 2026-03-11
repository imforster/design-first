import type { Board, Cell, Digit } from "../types";
import { deepCloneBoard } from "../utils";

/**
 * Creates a 9×9 Board from a puzzle array.
 * Non-null cells are marked as Given_Cells with their corresponding Digit value.
 */
export function initBoard(puzzle: (Digit | null)[][]): Board {
  const board: Board = [];
  for (let r = 0; r < 9; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < 9; c++) {
      const value = puzzle[r][c];
      row.push({
        value,
        isGiven: value !== null,
        pencilMarks: new Set<Digit>(),
      });
    }
    board.push(row);
  }
  return board;
}

/** Returns the Cell at the given row and column. */
export function getCell(board: Board, row: number, col: number): Cell {
  return board[row][col];
}

/**
 * Places a Digit in a Cell, returning a new Board.
 * Rejects modifications to Given_Cells — returns the Board unchanged.
 * Placing a Digit in a Cell with Pencil_Marks clears all Pencil_Marks.
 */
export function setCell(board: Board, row: number, col: number, digit: Digit): Board {
  if (board[row][col].isGiven) {
    return board;
  }
  const newBoard = deepCloneBoard(board);
  newBoard[row][col] = {
    value: digit,
    isGiven: false,
    pencilMarks: new Set<Digit>(),
  };
  return newBoard;
}

/**
 * Clears a non-given Cell's value, returning a new Board.
 * Given_Cells are not modified — returns the Board unchanged.
 */
export function clearCell(board: Board, row: number, col: number): Board {
  if (board[row][col].isGiven) {
    return board;
  }
  const newBoard = deepCloneBoard(board);
  newBoard[row][col] = {
    value: null,
    isGiven: false,
    pencilMarks: new Set<Digit>(board[row][col].pencilMarks),
  };
  return newBoard;
}

/** Returns true if the Cell at (row, col) is a Given_Cell. */
export function isGivenCell(board: Board, row: number, col: number): boolean {
  return board[row][col].isGiven;
}

/**
 * Toggles a Pencil_Mark for a Digit on a Cell.
 * Adds the Digit if not present, removes it if already present.
 * Only operates on empty (non-given, no value) cells — returns Board unchanged otherwise.
 */
export function togglePencilMark(board: Board, row: number, col: number, digit: Digit): Board {
  const cell = board[row][col];
  if (cell.isGiven || cell.value !== null) {
    return board;
  }
  const newBoard = deepCloneBoard(board);
  const marks = newBoard[row][col].pencilMarks;
  if (marks.has(digit)) {
    marks.delete(digit);
  } else {
    marks.add(digit);
  }
  return newBoard;
}

/** Returns true when all 81 Cells have a Digit value (no nulls). */
export function isBoardComplete(board: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c].value === null) {
        return false;
      }
    }
  }
  return true;
}
