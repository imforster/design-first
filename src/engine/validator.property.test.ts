import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  isRowValid,
  isColValid,
  isBoxValid,
  isBoardValid,
  isValidPlacement,
} from "./validator";
import { setCell } from "./board-manager";
import { candidates } from "./solver";
import { generate } from "./generator";
import type { Board, Cell, Digit } from "../types";
import { Difficulty } from "../types";

/**
 * Arbitrary that generates a 9×9 Sudoku Board with random cell values.
 * Each cell is either empty (null) or contains a Digit (1-9).
 * This does NOT guarantee a valid board — that's the point of the property test.
 */
const arbBoard: fc.Arbitrary<Board> = fc
  .array(
    fc.array(
      fc.integer({ min: 0, max: 9 }).map(
        (v): Cell => ({
          value: v === 0 ? null : (v as Digit),
          isGiven: v !== 0,
          pencilMarks: new Set(),
        })
      ),
      { minLength: 9, maxLength: 9 }
    ),
    { minLength: 9, maxLength: 9 }
  );

describe("Validator Property Tests", () => {
  /**
   * P7: Row/col/box constraints are complete
   * ∀ board: Board,
   *   isBoardValid(board) ⟺ all rows valid ∧ all cols valid ∧ all boxes valid
   *
   * **Validates: Requirements 2.4**
   */
  it("P7: isBoardValid iff all rows, columns, and boxes are valid", () => {
    fc.assert(
      fc.property(arbBoard, (board) => {
        const allRowsValid = Array.from({ length: 9 }, (_, r) =>
          isRowValid(board, r)
        ).every(Boolean);

        const allColsValid = Array.from({ length: 9 }, (_, c) =>
          isColValid(board, c)
        ).every(Boolean);

        const allBoxesValid = [0, 1, 2]
          .flatMap((br) => [0, 1, 2].map((bc) => isBoxValid(board, br, bc)))
          .every(Boolean);

        const boardValid = isBoardValid(board);
        const individualChecks = allRowsValid && allColsValid && allBoxesValid;

        expect(boardValid).toBe(individualChecks);
      }),
      { numRuns: 200 }
    );
  });

  /**
   * P8: Candidates are exactly the valid digits for a cell
   * ∀ board: Board, ∀ pos: Pos, ∀ d: Digit,
   *   candidates(board, pos).has(d) ⟺ isValidPlacement(board, pos.row, pos.col, d).kind === "valid"
   *
   * **Validates: Requirements 2.5**
   */
  it("P8: candidates(board, pos).has(d) iff isValidPlacement returns valid", () => {
    const arbRow = fc.integer({ min: 0, max: 8 });
    const arbCol = fc.integer({ min: 0, max: 8 });
    const arbDigit = fc.integer({ min: 1, max: 9 }) as fc.Arbitrary<Digit>;

    fc.assert(
      fc.property(arbBoard, arbRow, arbCol, arbDigit, (board, row, col, digit) => {
        // Only test empty cells — candidates are computed for empty cells,
        // and a filled cell's own value would appear in its row/col/box scan,
        // breaking the equivalence with isValidPlacement which only checks peers.
        fc.pre(board[row][col].value === null);

        const pos = { row, col };
        const cands = candidates(board, pos);
        const placement = isValidPlacement(board, row, col, digit);
        const isValid = placement.kind === "valid";

        expect(cands.has(digit)).toBe(isValid);
      }),
      { numRuns: 500 }
    );
  });

  /**
   * P5: Valid placement does not introduce conflicts
   * ∀ board: Board, ∀ row, col, digit,
   *   isValidPlacement(board, row, col, digit).kind === "valid"
   *   ⟹ isBoardValid(setCell(board, row, col, digit)) === true
   *
   * **Validates: Requirements 2.1, 2.2**
   */
  it("P5: valid placement produces a valid board", () => {
    // Generate valid boards by using the puzzle generator with a seed.
    // This guarantees the board is valid and has empty non-given cells.
    const arbValidBoard = fc.integer({ min: 0, max: 1_000_000 }).map((seed) =>
      generate(Difficulty.Easy, seed)
    );
    const arbRow = fc.integer({ min: 0, max: 8 });
    const arbCol = fc.integer({ min: 0, max: 8 });
    const arbDigit = fc.integer({ min: 1, max: 9 }) as fc.Arbitrary<Digit>;

    fc.assert(
      fc.property(arbValidBoard, arbRow, arbCol, arbDigit, (board, row, col, digit) => {
        // Cell must be empty and not a given cell
        fc.pre(board[row][col].value === null);
        fc.pre(!board[row][col].isGiven);

        const result = isValidPlacement(board, row, col, digit);
        if (result.kind === "valid") {
          const newBoard = setCell(board, row, col, digit);
          expect(isBoardValid(newBoard)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });
});
