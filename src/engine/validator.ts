import type { Board, Digit, ValidationResult } from "../types";
import { getBox } from "../utils";

/**
 * Returns true if the given row contains no duplicate non-null Digits.
 */
export function isRowValid(board: Board, row: number): boolean {
  const seen = new Set<Digit>();
  for (let col = 0; col < 9; col++) {
    const val = board[row][col].value;
    if (val !== null) {
      if (seen.has(val)) return false;
      seen.add(val);
    }
  }
  return true;
}

/**
 * Returns true if the given column contains no duplicate non-null Digits.
 */
export function isColValid(board: Board, col: number): boolean {
  const seen = new Set<Digit>();
  for (let row = 0; row < 9; row++) {
    const val = board[row][col].value;
    if (val !== null) {
      if (seen.has(val)) return false;
      seen.add(val);
    }
  }
  return true;
}

/**
 * Returns true if the 3×3 box at (boxRow, boxCol) contains no duplicate non-null Digits.
 * boxRow and boxCol are 0-2, identifying which of the 9 boxes to check.
 */
export function isBoxValid(board: Board, boxRow: number, boxCol: number): boolean {
  const seen = new Set<Digit>();
  const startRow = boxRow * 3;
  const startCol = boxCol * 3;
  for (let r = startRow; r < startRow + 3; r++) {
    for (let c = startCol; c < startCol + 3; c++) {
      const val = board[r][c].value;
      if (val !== null) {
        if (seen.has(val)) return false;
        seen.add(val);
      }
    }
  }
  return true;
}

/**
 * Returns true iff all 9 rows, 9 columns, and 9 boxes have no duplicate Digits.
 */
export function isBoardValid(board: Board): boolean {
  for (let i = 0; i < 9; i++) {
    if (!isRowValid(board, i)) return false;
    if (!isColValid(board, i)) return false;
  }
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      if (!isBoxValid(board, boxRow, boxCol)) return false;
    }
  }
  return true;
}

/**
 * Returns positions of all cells that conflict with placing the given digit
 * at (row, col). A conflict is a peer cell (same row, column, or box) that
 * already contains the same digit.
 */
export function getConflicts(
  board: Board,
  row: number,
  col: number,
  digit: Digit
): [number, number][] {
  const conflicts: [number, number][] = [];
  const { boxRow, boxCol } = getBox({ row, col });
  const boxStartRow = boxRow * 3;
  const boxStartCol = boxCol * 3;

  // Check row peers
  for (let c = 0; c < 9; c++) {
    if (c !== col && board[row][c].value === digit) {
      conflicts.push([row, c]);
    }
  }

  // Check column peers
  for (let r = 0; r < 9; r++) {
    if (r !== row && board[r][col].value === digit) {
      conflicts.push([r, col]);
    }
  }

  // Check box peers (avoid duplicates from row/col checks)
  for (let r = boxStartRow; r < boxStartRow + 3; r++) {
    for (let c = boxStartCol; c < boxStartCol + 3; c++) {
      if (r !== row && c !== col && board[r][c].value === digit) {
        // Only add if not already found via row or column check
        if (r !== row && c !== col) {
          conflicts.push([r, c]);
        }
      }
    }
  }

  return conflicts;
}

/**
 * Checks if placing a digit at (row, col) would conflict with any peer.
 * Returns { kind: "valid" } if no conflicts, or { kind: "conflict", conflicts: [...] }
 * with positions of all conflicting peers.
 */
export function isValidPlacement(
  board: Board,
  row: number,
  col: number,
  digit: Digit
): ValidationResult {
  const conflicts = getConflicts(board, row, col, digit);
  if (conflicts.length === 0) {
    return { kind: "valid" };
  }
  return { kind: "conflict", conflicts };
}
