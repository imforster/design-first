import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { generate } from "./generator";
import { countSolutions } from "./solver";
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

describe("Generator Property Tests", () => {
  /**
   * P4: Generated puzzles have exactly one solution
   * ∀ difficulty: Difficulty, countSolutions(generate(difficulty), 2) === 1
   *
   * **Validates: Requirements 4.1**
   */
  it("P4: generated puzzles have exactly one solution", () => {
    fc.assert(
      fc.property(arbDifficulty, arbSeed, (difficulty, seed) => {
        const puzzle = generate(difficulty, seed);
        expect(countSolutions(puzzle, 2)).toBe(1);
      }),
      { numRuns: 20 }
    );
  });
});
