import type { Board, Digit, Pos, SolveResult } from "../types";
import { deepCloneBoard, getBox, getEmptyCells } from "../utils";
import { isBoardValid } from "./validator";

const ALL_DIGITS: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * Computes the set of valid candidate digits for a cell by checking
 * which digits are not already present in the cell's row, column, or box.
 */
export function candidates(board: Board, pos: Pos): Set<Digit> {
  const used = new Set<Digit>();

  // Row peers
  for (let c = 0; c < 9; c++) {
    const v = board[pos.row][c].value;
    if (v !== null) used.add(v);
  }

  // Column peers
  for (let r = 0; r < 9; r++) {
    const v = board[r][pos.col].value;
    if (v !== null) used.add(v);
  }

  // Box peers
  const { boxRow, boxCol } = getBox(pos);
  const startRow = boxRow * 3;
  const startCol = boxCol * 3;
  for (let r = startRow; r < startRow + 3; r++) {
    for (let c = startCol; c < startCol + 3; c++) {
      const v = board[r][c].value;
      if (v !== null) used.add(v);
    }
  }

  const result = new Set<Digit>();
  for (const d of ALL_DIGITS) {
    if (!used.has(d)) result.add(d);
  }
  return result;
}

/**
 * Propagate constraints: if any empty cell has exactly one candidate, fill it.
 * Repeat until no more naked singles remain.
 * Returns null if a contradiction is found (an empty cell with zero candidates).
 */
export function propagate(board: Board): Board | null {
  const b = deepCloneBoard(board);
  let changed = true;

  while (changed) {
    changed = false;
    for (const pos of getEmptyCells(b)) {
      const cands = candidates(b, pos);
      if (cands.size === 0) return null; // contradiction
      if (cands.size === 1) {
        const [digit] = cands;
        b[pos.row][pos.col] = { value: digit as Digit, isGiven: false, pencilMarks: new Set() };
        changed = true;
      }
    }
  }
  return b;
}

/** Internal recursive solver — assumes board is already valid. */
function solveInternal(board: Board): SolveResult {
  const propagated = propagate(board);
  if (!propagated) return { kind: "noSolution" };

  const empties = getEmptyCells(propagated);
  if (empties.length === 0) return { kind: "solved", board: propagated };

  // MRV: pick the empty cell with the fewest candidates
  let target = empties[0];
  let minCands = candidates(propagated, target);
  for (const pos of empties) {
    const cands = candidates(propagated, pos);
    if (cands.size < minCands.size) {
      target = pos;
      minCands = cands;
    }
  }

  if (minCands.size === 0) return { kind: "noSolution" };

  for (const digit of minCands) {
    const next = deepCloneBoard(propagated);
    next[target.row][target.col] = { value: digit as Digit, isGiven: false, pencilMarks: new Set() };
    const result = solveInternal(next);
    if (result.kind === "solved") return result;
  }

  return { kind: "noSolution" };
}

/**
 * Solve a Sudoku board using constraint propagation followed by
 * backtracking with the MRV (Minimum Remaining Values) heuristic.
 *
 * Returns:
 * - { kind: "solved", board } if a solution is found
 * - { kind: "noSolution" } if no valid completion exists
 */
export function solve(board: Board): SolveResult {
  if (!isBoardValid(board)) return { kind: "noSolution" };
  return solveInternal(board);
}

/** Internal recursive solution counter — assumes board is already valid. */
function countSolutionsInternal(board: Board, limit: number): number {
  const propagated = propagate(board);
  if (!propagated) return 0;

  const empties = getEmptyCells(propagated);
  if (empties.length === 0) return 1;

  // MRV heuristic
  let target = empties[0];
  let minCands = candidates(propagated, target);
  for (const pos of empties) {
    const cands = candidates(propagated, pos);
    if (cands.size < minCands.size) {
      target = pos;
      minCands = cands;
    }
  }

  let count = 0;
  for (const digit of minCands) {
    const next = deepCloneBoard(propagated);
    next[target.row][target.col] = { value: digit as Digit, isGiven: false, pencilMarks: new Set() };
    count += countSolutionsInternal(next, limit - count);
    if (count >= limit) return count;
  }
  return count;
}

/**
 * Count the number of distinct solutions for a board, up to a specified limit.
 * Defaults to limit=2, which is sufficient for uniqueness checking
 * (1 = unique, 2+ = multiple solutions).
 */
export function countSolutions(board: Board, limit: number = 2): number {
  if (!isBoardValid(board)) return 0;
  return countSolutionsInternal(board, limit);
}

/**
 * Public API: returns the set of candidate digits for a given cell position.
 * This is the set of digits 1-9 that do not conflict with any peer of the cell.
 */
export function getCandidates(board: Board, row: number, col: number): Set<Digit> {
  return candidates(board, { row, col });
}

/**
 * Provides a hint by identifying one empty cell and the correct digit
 * from the puzzle's unique solution.
 *
 * Returns null if the board is already complete or unsolvable.
 */
export function getHint(board: Board): { row: number; col: number; digit: Digit } | null {
  const result = solve(board);
  if (result.kind !== "solved") return null;

  const empties = getEmptyCells(board);
  if (empties.length === 0) return null;

  const first = empties[0];
  const digit = result.board[first.row][first.col].value!;
  return { row: first.row, col: first.col, digit };
}

