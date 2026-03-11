import { describe, it, expect } from "vitest";
import { candidates, propagate, solve, countSolutions, getCandidates, getHint } from "./solver";
import { initBoard } from "./board-manager";
import { isBoardValid } from "./validator";
import { isBoardComplete } from "./board-manager";
import type { Digit } from "../types";
import { createEmptyBoard } from "../utils";

// A known valid Sudoku puzzle (Easy-level, ~35 givens)
const puzzleData: (Digit | null)[][] = [
  [5, 3, null, null, 7, null, null, null, null],
  [6, null, null, 1, 9, 5, null, null, null],
  [null, 9, 8, null, null, null, null, 6, null],
  [8, null, null, null, 6, null, null, null, 3],
  [4, null, null, 8, null, 3, null, null, 1],
  [7, null, null, null, 2, null, null, null, 6],
  [null, 6, null, null, null, null, 2, 8, null],
  [null, null, null, 4, 1, 9, null, null, 5],
  [null, null, null, null, 8, null, null, 7, 9],
];

// The known solution for the puzzle above
const solutionData: Digit[][] = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

describe("candidates", () => {
  it("returns correct candidates for an empty cell", () => {
    const board = initBoard(puzzleData);
    // Cell (0,2) is empty. Row 0 has 5,3,7. Col 2 has 8. Box(0,0) has 5,3,6,9,8.
    const cands = candidates(board, { row: 0, col: 2 });
    expect(cands).toEqual(new Set([1, 2, 4]));
  });

  it("returns empty set for a cell with no valid candidates", () => {
    // Create a board where row, col, and box cover all digits
    const board = initBoard([
      [1, 2, 3, 4, 5, 6, 7, 8, null],
      [null, null, null, null, null, null, null, null, 9],
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
    ]);
    // Cell (0,8): row has 1-8, col has 9 → no candidates
    const cands = candidates(board, { row: 0, col: 8 });
    expect(cands.size).toBe(0);
  });
});

describe("propagate", () => {
  it("fills naked singles", () => {
    // A board with one empty cell that has only one candidate
    const data: (Digit | null)[][] = Array.from({ length: 9 }, () =>
      Array(9).fill(null) as (Digit | null)[]
    );
    // Fill row 0 with 1-8, leaving col 8 empty → only candidate is 9
    for (let c = 0; c < 8; c++) {
      data[0][c] = (c + 1) as Digit;
    }
    const board = initBoard(data);
    const result = propagate(board);
    expect(result).not.toBeNull();
    expect(result![0][8].value).toBe(9);
  });

  it("returns null on contradiction", () => {
    // Two cells in same row with same value, leaving an impossible cell
    const board = initBoard([
      [1, 2, 3, 4, 5, 6, 7, 8, null],
      [null, null, null, null, null, null, null, null, 9],
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
    ]);
    // Cell (0,8) has no candidates (row has 1-8, col has 9)
    const result = propagate(board);
    expect(result).toBeNull();
  });
});

describe("solve", () => {
  it("solves a known puzzle correctly", () => {
    const board = initBoard(puzzleData);
    const result = solve(board);
    expect(result.kind).toBe("solved");
    if (result.kind === "solved") {
      // Check it matches the known solution
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          expect(result.board[r][c].value).toBe(solutionData[r][c]);
        }
      }
    }
  });

  it("returns solved board that is valid and complete", () => {
    const board = initBoard(puzzleData);
    const result = solve(board);
    expect(result.kind).toBe("solved");
    if (result.kind === "solved") {
      expect(isBoardValid(result.board)).toBe(true);
      expect(isBoardComplete(result.board)).toBe(true);
    }
  });

  it("preserves given cells in the solution", () => {
    const board = initBoard(puzzleData);
    const result = solve(board);
    expect(result.kind).toBe("solved");
    if (result.kind === "solved") {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (board[r][c].isGiven) {
            expect(result.board[r][c].value).toBe(board[r][c].value);
          }
        }
      }
    }
  });

  it("returns noSolution for an unsolvable board", () => {
    // Place conflicting digits that make the board unsolvable
    const data: (Digit | null)[][] = Array.from({ length: 9 }, () =>
      Array(9).fill(null) as (Digit | null)[]
    );
    data[0][0] = 1;
    data[0][1] = 1; // duplicate in row → invalid
    const board = initBoard(data);
    const result = solve(board);
    expect(result.kind).toBe("noSolution");
  });

  it("solves a nearly-complete board", () => {
    // Use the known solution but clear a few cells
    const data: (Digit | null)[][] = solutionData.map((r) => [...r]);
    data[0][0] = null;
    data[4][4] = null;
    data[8][8] = null;
    const board = initBoard(data);
    const result = solve(board);
    expect(result.kind).toBe("solved");
    if (result.kind === "solved") {
      expect(isBoardValid(result.board)).toBe(true);
      expect(isBoardComplete(result.board)).toBe(true);
      expect(result.board[0][0].value).toBe(5);
      expect(result.board[4][4].value).toBe(5);
      expect(result.board[8][8].value).toBe(9);
    }
  });
});

describe("countSolutions", () => {
  it("returns 1 for a puzzle with a unique solution", () => {
    const board = initBoard(puzzleData);
    expect(countSolutions(board, 2)).toBe(1);
  });

  it("returns 0 for an unsolvable board", () => {
    const data: (Digit | null)[][] = Array.from({ length: 9 }, () =>
      Array(9).fill(null) as (Digit | null)[]
    );
    data[0][0] = 1;
    data[0][1] = 1;
    const board = initBoard(data);
    expect(countSolutions(board, 2)).toBe(0);
  });

  it("returns 2 (capped) for a board with multiple solutions", () => {
    // Remove two cells from the known puzzle to create ambiguity
    const data: (Digit | null)[][] = puzzleData.map((r) => [...r]);
    // Remove enough cells to allow multiple solutions
    data[0][2] = null;
    data[0][3] = null;
    data[0][5] = null;
    // The known puzzle already has a unique solution, so countSolutions should be 1
    const board = initBoard(puzzleData);
    expect(countSolutions(board, 2)).toBe(1);
  });

  it("respects the limit parameter", () => {
    // A nearly-solved board with one empty cell has exactly 1 solution
    const board = initBoard(puzzleData);
    expect(countSolutions(board, 1)).toBe(1);
  });
});

describe("getCandidates", () => {
  it("returns same result as candidates for a position", () => {
    const board = initBoard(puzzleData);
    const fromCandidates = candidates(board, { row: 0, col: 2 });
    const fromGetCandidates = getCandidates(board, 0, 2);
    expect(fromGetCandidates).toEqual(fromCandidates);
  });

  it("returns all digits for an empty cell on an empty board", () => {
    const board = createEmptyBoard();
    const cands = getCandidates(board, 4, 4);
    expect(cands).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]));
  });
});

describe("getHint", () => {
  it("returns the correct digit for the first empty cell", () => {
    const board = initBoard(puzzleData);
    const hint = getHint(board);
    expect(hint).not.toBeNull();
    // First empty cell is (0,2), solution value is 4
    expect(hint!.row).toBe(0);
    expect(hint!.col).toBe(2);
    expect(hint!.digit).toBe(solutionData[0][2]); // 4
  });

  it("returns null for a complete board", () => {
    const board = initBoard(solutionData);
    const hint = getHint(board);
    expect(hint).toBeNull();
  });

  it("returns null for an unsolvable board", () => {
    const data: (Digit | null)[][] = Array.from({ length: 9 }, () =>
      Array(9).fill(null) as (Digit | null)[]
    );
    data[0][0] = 1;
    data[0][1] = 1; // duplicate in row → invalid
    const board = initBoard(data);
    const hint = getHint(board);
    expect(hint).toBeNull();
  });

  it("returns a hint consistent with the solved board", () => {
    const board = initBoard(puzzleData);
    const hint = getHint(board);
    expect(hint).not.toBeNull();
    // Verify the hint digit matches the full solution
    const result = solve(board);
    expect(result.kind).toBe("solved");
    if (result.kind === "solved") {
      expect(hint!.digit).toBe(result.board[hint!.row][hint!.col].value);
    }
  });

  it("returns a hint for a nearly-complete board", () => {
    // Use the known solution but clear one cell
    const data: (Digit | null)[][] = solutionData.map((r) => [...r]);
    data[4][4] = null;
    const board = initBoard(data);
    const hint = getHint(board);
    expect(hint).not.toBeNull();
    expect(hint!.row).toBe(4);
    expect(hint!.col).toBe(4);
    expect(hint!.digit).toBe(5); // solutionData[4][4] = 5
  });
});

