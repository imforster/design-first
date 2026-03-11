import { describe, it, expect } from "vitest";
import {
  seededRandom,
  generateSolvedBoard,
  removeCells,
  generate,
  estimateDifficulty,
} from "./generator";
import { Difficulty } from "../types";
import type { Digit } from "../types";
import { isBoardValid } from "./validator";
import { countSolutions } from "./solver";
import { allPositions } from "../utils";

describe("seededRandom", () => {
  it("produces deterministic output for the same seed", () => {
    const rng1 = seededRandom(42);
    const rng2 = seededRandom(42);
    const values1 = Array.from({ length: 10 }, () => rng1());
    const values2 = Array.from({ length: 10 }, () => rng2());
    expect(values1).toEqual(values2);
  });

  it("produces values in [0, 1)", () => {
    const rng = seededRandom(123);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("produces different output for different seeds", () => {
    const rng1 = seededRandom(1);
    const rng2 = seededRandom(2);
    const v1 = rng1();
    const v2 = rng2();
    expect(v1).not.toEqual(v2);
  });
});

describe("generateSolvedBoard", () => {
  it("produces a fully filled valid board", () => {
    const rng = seededRandom(42);
    const board = generateSolvedBoard(rng);

    // All 81 cells should be filled
    let filledCount = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c].value !== null) filledCount++;
      }
    }
    expect(filledCount).toBe(81);
    expect(isBoardValid(board)).toBe(true);
  });

  it("produces different boards for different seeds", () => {
    const board1 = generateSolvedBoard(seededRandom(1));
    const board2 = generateSolvedBoard(seededRandom(999));

    // Compare first row values — extremely unlikely to be identical
    const row1 = board1[0].map((c) => c.value);
    const row2 = board2[0].map((c) => c.value);
    expect(row1).not.toEqual(row2);
  });
});

describe("removeCells", () => {
  it("maintains unique solvability after removal", () => {
    const rng = seededRandom(42);
    const solved = generateSolvedBoard(rng);
    const board = solved.map((row) =>
      row.map((cell) => ({
        value: cell.value,
        isGiven: true as boolean,
        pencilMarks: new Set() as Set<Digit>,
      }))
    );

    const positions = allPositions();
    const puzzle = removeCells(board, positions, 30, 81);
    expect(countSolutions(puzzle, 2)).toBe(1);
  });
});

describe("generate", () => {
  it("produces a puzzle with unique solution", () => {
    const puzzle = generate(Difficulty.Easy, 42);
    expect(countSolutions(puzzle, 2)).toBe(1);
  });

  it("produces reproducible puzzles with the same seed", () => {
    const p1 = generate(Difficulty.Medium, 100);
    const p2 = generate(Difficulty.Medium, 100);

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        expect(p1[r][c].value).toBe(p2[r][c].value);
        expect(p1[r][c].isGiven).toBe(p2[r][c].isGiven);
      }
    }
  });

  it("Easy puzzle has 35-45 givens", () => {
    const puzzle = generate(Difficulty.Easy, 42);
    const givens = countGivens(puzzle);
    expect(givens).toBeGreaterThanOrEqual(35);
    expect(givens).toBeLessThanOrEqual(45);
  });

  it("Medium puzzle has 28-38 givens", () => {
    const puzzle = generate(Difficulty.Medium, 42);
    const givens = countGivens(puzzle);
    expect(givens).toBeGreaterThanOrEqual(28);
    expect(givens).toBeLessThanOrEqual(38);
  });

  it("Hard puzzle has 22-32 givens", () => {
    const puzzle = generate(Difficulty.Hard, 42);
    const givens = countGivens(puzzle);
    expect(givens).toBeGreaterThanOrEqual(22);
    expect(givens).toBeLessThanOrEqual(32);
  });

  it("Expert puzzle has 17-28 givens", () => {
    const puzzle = generate(Difficulty.Expert, 42);
    const givens = countGivens(puzzle);
    expect(givens).toBeGreaterThanOrEqual(17);
    expect(givens).toBeLessThanOrEqual(28);
  });
});

describe("estimateDifficulty", () => {
  it("returns Easy for 35+ givens", () => {
    const puzzle = generate(Difficulty.Easy, 42);
    expect(estimateDifficulty(puzzle)).toBe(Difficulty.Easy);
  });

  it("returns Expert for very few givens", () => {
    const puzzle = generate(Difficulty.Expert, 42);
    const givens = countGivens(puzzle);
    if (givens < 22) {
      expect(estimateDifficulty(puzzle)).toBe(Difficulty.Expert);
    }
  });

  it("maps given counts to correct difficulty ranges", () => {
    // Create a mock board with a specific number of givens
    const makeBoard = (givenCount: number) => {
      const board = Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => ({
          value: null as Digit | null,
          isGiven: false,
          pencilMarks: new Set<Digit>(),
        }))
      );
      let count = 0;
      for (let r = 0; r < 9 && count < givenCount; r++) {
        for (let c = 0; c < 9 && count < givenCount; c++) {
          board[r][c].value = ((count % 9) + 1) as Digit;
          count++;
        }
      }
      return board;
    };

    expect(estimateDifficulty(makeBoard(40))).toBe(Difficulty.Easy);
    expect(estimateDifficulty(makeBoard(35))).toBe(Difficulty.Easy);
    expect(estimateDifficulty(makeBoard(30))).toBe(Difficulty.Medium);
    expect(estimateDifficulty(makeBoard(28))).toBe(Difficulty.Medium);
    expect(estimateDifficulty(makeBoard(25))).toBe(Difficulty.Hard);
    expect(estimateDifficulty(makeBoard(22))).toBe(Difficulty.Hard);
    expect(estimateDifficulty(makeBoard(20))).toBe(Difficulty.Expert);
    expect(estimateDifficulty(makeBoard(17))).toBe(Difficulty.Expert);
  });
});

function countGivens(board: any[][]): number {
  let count = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c].value !== null) count++;
    }
  }
  return count;
}
