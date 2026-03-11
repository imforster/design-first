import type { Board, Digit, Pos } from "../types";
import { Difficulty } from "../types";
import { allPositions, createEmptyBoard, deepCloneBoard, getEmptyCells } from "../utils";
import { candidates, countSolutions, propagate } from "./solver";

/**
 * Seeded pseudo-random number generator (mulberry32).
 * Returns a function that produces numbers in [0, 1).
 */
export function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates shuffle using the provided RNG. */
function shuffle<T>(array: T[], rng: () => number): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Solve an empty board with randomized candidate ordering to produce
 * a fully solved board. Uses constraint propagation + backtracking.
 */
export function generateSolvedBoard(rng: () => number): Board {
  const board = createEmptyBoard();
  const result = solveWithRandomization(board, rng);
  if (!result) {
    throw new Error("Failed to generate a solved board");
  }
  return result;
}

/** Internal solver that randomizes candidate ordering for variety. */
function solveWithRandomization(board: Board, rng: () => number): Board | null {
  const propagated = propagate(board);
  if (!propagated) return null;

  const empties = getEmptyCells(propagated);
  if (empties.length === 0) return propagated;

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

  if (minCands.size === 0) return null;

  // Randomize candidate ordering for variety
  const shuffledCands = shuffle([...minCands], rng);

  for (const digit of shuffledCands) {
    const next = deepCloneBoard(propagated);
    next[target.row][target.col] = {
      value: digit as Digit,
      isGiven: false,
      pencilMarks: new Set(),
    };
    const result = solveWithRandomization(next, rng);
    if (result) return result;
  }

  return null;
}


/**
 * Remove cells one at a time from a solved board, checking that the puzzle
 * retains a unique solution after each removal. Positions are tried in the
 * given order (should be shuffled for variety).
 */
export function removeCells(
  board: Board,
  positions: Pos[],
  targetGivens: number,
  currentGivens: number
): Board {
  const b = deepCloneBoard(board);
  let givens = currentGivens;

  for (const pos of positions) {
    if (givens <= targetGivens) break;

    const saved = b[pos.row][pos.col].value;
    if (saved === null) continue; // already empty

    b[pos.row][pos.col] = { value: null, isGiven: false, pencilMarks: new Set() };

    if (countSolutions(b, 2) === 1) {
      givens--;
    } else {
      // Removing this cell creates multiple solutions; restore it
      b[pos.row][pos.col] = { value: saved, isGiven: true, pencilMarks: new Set() };
    }
  }

  return b;
}

/** Target number of givens for each difficulty level. */
const TARGET_GIVENS: Record<Difficulty, number> = {
  [Difficulty.Easy]: 38,
  [Difficulty.Medium]: 30,
  [Difficulty.Hard]: 25,
  [Difficulty.Expert]: 20,
};

/**
 * Generate a Sudoku puzzle with a unique solution at the specified difficulty.
 * Optionally accepts a seed for reproducible generation.
 *
 * Algorithm:
 * 1. Create a seeded (or unseeded) RNG
 * 2. Generate a fully solved board with randomized candidate ordering
 * 3. Shuffle all 81 positions
 * 4. Remove cells one at a time while maintaining unique solvability
 * 5. Mark remaining filled cells as givens
 */
export function generate(difficulty: Difficulty, seed?: number): Board {
  const rng = seed !== undefined ? seededRandom(seed) : () => Math.random();
  const solved = generateSolvedBoard(rng);

  // Mark all cells as given in the solved board
  const board = solved.map((row) =>
    row.map((cell) => ({
      value: cell.value,
      isGiven: true,
      pencilMarks: new Set<Digit>(),
    }))
  );

  const positions = shuffle(allPositions(), rng);
  const target = TARGET_GIVENS[difficulty];

  const puzzle = removeCells(board, positions, target, 81);
  return puzzle;
}

/**
 * Estimate the difficulty of a board based on the number of given cells.
 * Maps given cell count to the closest difficulty range.
 */
export function estimateDifficulty(board: Board): Difficulty {
  let givenCount = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c].value !== null) {
        givenCount++;
      }
    }
  }

  if (givenCount >= 35) return Difficulty.Easy;
  if (givenCount >= 28) return Difficulty.Medium;
  if (givenCount >= 22) return Difficulty.Hard;
  return Difficulty.Expert;
}
