import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { pushMove, undo } from "./history-manager";
import type { Digit, Move, History } from "../types";

/**
 * Arbitrary that generates a valid Digit (1-9).
 */
const arbDigit: fc.Arbitrary<Digit> = fc.integer({ min: 1, max: 9 }) as fc.Arbitrary<Digit>;

/**
 * Arbitrary that generates a Digit or null (for cell values).
 */
const arbDigitOrNull: fc.Arbitrary<Digit | null> = fc.oneof(
  fc.constant(null as Digit | null),
  arbDigit
);

/**
 * Arbitrary that generates a Set<Digit> for pencil marks.
 */
const arbPencilMarks: fc.Arbitrary<Set<Digit>> = fc
  .subarray([1, 2, 3, 4, 5, 6, 7, 8, 9] as Digit[])
  .map((arr) => new Set(arr));

/**
 * Arbitrary that generates a Move object with valid row/col (0-8),
 * optional old/new values, and pencil mark sets.
 */
const arbMove: fc.Arbitrary<Move> = fc.record({
  row: fc.integer({ min: 0, max: 8 }),
  col: fc.integer({ min: 0, max: 8 }),
  oldValue: arbDigitOrNull,
  newValue: arbDigitOrNull,
  oldPencilMarks: arbPencilMarks,
  newPencilMarks: arbPencilMarks,
});

/**
 * Arbitrary that generates a History object with arbitrary undo and redo stacks.
 */
const arbHistory: fc.Arbitrary<History> = fc.record({
  undoStack: fc.array(arbMove, { minLength: 0, maxLength: 10 }),
  redoStack: fc.array(arbMove, { minLength: 0, maxLength: 10 }),
});

describe("History Manager Property Tests", () => {
  /**
   * P6: Undo reverses the last move exactly
   * ∀ history: History, ∀ move: Move,
   *   undo(pushMove(history, move)) returns move
   *
   * **Validates: Requirements 5.2**
   */
  it("P6: undo(pushMove(history, move)) returns that move", () => {
    fc.assert(
      fc.property(arbHistory, arbMove, (history, move) => {
        const afterPush = pushMove(history, move);
        const result = undo(afterPush);

        expect(result).not.toBeNull();
        expect(result!.move).toBe(move);
      }),
      { numRuns: 500 }
    );
  });
});
