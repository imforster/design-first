import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { solve } from "./solver";
import { isBoardValid } from "./validator";
import { isBoardComplete } from "./board-manager";
import { generate } from "./generator";
import { Difficulty } from "../types";

/** Arbitrary for a random Difficulty value. */
const arbDifficulty: fc.Arbitrary<Difficulty> = fc.constantFrom(
  Difficulty.Easy,
  Difficulty.Medium,
  Difficulty.Hard,
  Difficulty.Expert
);

/** Arbitrary for a seed value used in puzzle generation. */
const arbSeed = fc.integer({ min: 0, max: 1_000_000 });

describe("Solver Property Tests", () => {
  /**
   * P1: A solved board is always valid
   * ∀ board: Board, solve(board).kind === "solved" ⟹ isBoardValid(solve(board).board) === true
   *
   * **Validates: Requirements 3.2**
   */
  it("P1: a solved board is always valid", () => {
    fc.assert(
      fc.property(arbDifficulty, arbSeed, (difficulty, seed) => {
        const board = generate(difficulty, seed);
        const result = solve(board);

        if (result.kind === "solved") {
          expect(isBoardValid(result.board)).toBe(true);
        }
      }),
      { numRuns: 50 }
    );
  });

  /**
   * P2: A solved board is always complete
   * ∀ board: Board, solve(board).kind === "solved" ⟹ isBoardComplete(solve(board).board) === true
   *
   * **Validates: Requirements 3.2**
   */
  it("P2: a solved board is always complete", () => {
    fc.assert(
      fc.property(arbDifficulty, arbSeed, (difficulty, seed) => {
        const board = generate(difficulty, seed);
        const result = solve(board);

        if (result.kind === "solved") {
          expect(isBoardComplete(result.board)).toBe(true);
        }
      }),
      { numRuns: 50 }
    );
  });

  /**
   * P3: Solving preserves given cells
   * ∀ board: Board, ∀ row, col: number,
   *   solve(board).kind === "solved" ∧ board[row][col].isGiven
   *   ⟹ solvedBoard[row][col].value === board[row][col].value
   *
   * **Validates: Requirements 3.3**
   */
  it("P3: solving preserves given cells", () => {
    fc.assert(
      fc.property(arbDifficulty, arbSeed, (difficulty, seed) => {
        const board = generate(difficulty, seed);
        const result = solve(board);

        if (result.kind === "solved") {
          for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
              if (board[r][c].isGiven) {
                expect(result.board[r][c].value).toBe(board[r][c].value);
              }
            }
          }
        }
      }),
      { numRuns: 50 }
    );
  });
});
