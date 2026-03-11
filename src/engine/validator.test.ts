import { describe, it, expect } from "vitest";
import {
  isRowValid,
  isColValid,
  isBoxValid,
  isBoardValid,
  isValidPlacement,
  getConflicts,
} from "./validator";
import { initBoard } from "./board-manager";
import { createEmptyBoard } from "../utils";
import type { Digit } from "../types";

/** Helper: create a board from a 9×9 number grid (0 = empty) */
function boardFrom(grid: number[][]): ReturnType<typeof initBoard> {
  const puzzle = grid.map((row) =>
    row.map((v) => (v === 0 ? null : (v as Digit)))
  );
  return initBoard(puzzle);
}

// A known valid complete Sudoku board
const validComplete = [
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

describe("isRowValid", () => {
  it("returns true for a valid row", () => {
    const board = boardFrom(validComplete);
    expect(isRowValid(board, 0)).toBe(true);
  });

  it("returns true for a row with empty cells and no duplicates", () => {
    const board = createEmptyBoard();
    board[0][0].value = 1;
    board[0][4].value = 5;
    expect(isRowValid(board, 0)).toBe(true);
  });

  it("returns false for a row with duplicate digits", () => {
    const board = createEmptyBoard();
    board[0][0].value = 3;
    board[0][5].value = 3;
    expect(isRowValid(board, 0)).toBe(false);
  });

  it("returns true for an entirely empty row", () => {
    const board = createEmptyBoard();
    expect(isRowValid(board, 4)).toBe(true);
  });
});

describe("isColValid", () => {
  it("returns true for a valid column", () => {
    const board = boardFrom(validComplete);
    expect(isColValid(board, 0)).toBe(true);
  });

  it("returns false for a column with duplicate digits", () => {
    const board = createEmptyBoard();
    board[0][2].value = 7;
    board[6][2].value = 7;
    expect(isColValid(board, 2)).toBe(false);
  });
});

describe("isBoxValid", () => {
  it("returns true for a valid box", () => {
    const board = boardFrom(validComplete);
    expect(isBoxValid(board, 0, 0)).toBe(true);
  });

  it("returns false for a box with duplicate digits", () => {
    const board = createEmptyBoard();
    board[0][0].value = 4;
    board[2][2].value = 4;
    expect(isBoxValid(board, 0, 0)).toBe(false);
  });
});

describe("isBoardValid", () => {
  it("returns true for a valid complete board", () => {
    const board = boardFrom(validComplete);
    expect(isBoardValid(board)).toBe(true);
  });

  it("returns true for an empty board", () => {
    const board = createEmptyBoard();
    expect(isBoardValid(board)).toBe(true);
  });

  it("returns false when a row has duplicates", () => {
    const board = createEmptyBoard();
    board[3][0].value = 2;
    board[3][8].value = 2;
    expect(isBoardValid(board)).toBe(false);
  });

  it("returns false when a column has duplicates", () => {
    const board = createEmptyBoard();
    board[0][5].value = 9;
    board[8][5].value = 9;
    expect(isBoardValid(board)).toBe(false);
  });

  it("returns false when a box has duplicates", () => {
    const board = createEmptyBoard();
    board[3][3].value = 6;
    board[5][5].value = 6;
    expect(isBoardValid(board)).toBe(false);
  });
});

describe("getConflicts", () => {
  it("returns empty array when no conflicts exist", () => {
    const board = createEmptyBoard();
    board[0][0].value = 1;
    const conflicts = getConflicts(board, 0, 4, 5 as Digit);
    expect(conflicts).toEqual([]);
  });

  it("finds row conflicts", () => {
    const board = createEmptyBoard();
    board[0][3].value = 5;
    const conflicts = getConflicts(board, 0, 7, 5 as Digit);
    expect(conflicts).toContainEqual([0, 3]);
  });

  it("finds column conflicts", () => {
    const board = createEmptyBoard();
    board[6][2].value = 8;
    const conflicts = getConflicts(board, 1, 2, 8 as Digit);
    expect(conflicts).toContainEqual([6, 2]);
  });

  it("finds box conflicts", () => {
    const board = createEmptyBoard();
    board[1][1].value = 4;
    const conflicts = getConflicts(board, 2, 2, 4 as Digit);
    expect(conflicts).toContainEqual([1, 1]);
  });

  it("finds multiple conflicts across row, column, and box", () => {
    const board = createEmptyBoard();
    board[4][0].value = 3; // row peer
    board[0][4].value = 3; // col peer
    board[3][3].value = 3; // box peer
    const conflicts = getConflicts(board, 4, 4, 3 as Digit);
    expect(conflicts).toHaveLength(3);
    expect(conflicts).toContainEqual([4, 0]);
    expect(conflicts).toContainEqual([0, 4]);
    expect(conflicts).toContainEqual([3, 3]);
  });
});

describe("isValidPlacement", () => {
  it("returns valid when no conflicts", () => {
    const board = createEmptyBoard();
    const result = isValidPlacement(board, 0, 0, 1 as Digit);
    expect(result).toEqual({ kind: "valid" });
  });

  it("returns conflict with positions when conflicts exist", () => {
    const board = createEmptyBoard();
    board[0][5].value = 7;
    const result = isValidPlacement(board, 0, 0, 7 as Digit);
    expect(result.kind).toBe("conflict");
    if (result.kind === "conflict") {
      expect(result.conflicts).toContainEqual([0, 5]);
    }
  });

  it("detects conflict in same box but different row and column", () => {
    const board = createEmptyBoard();
    board[1][1].value = 9;
    const result = isValidPlacement(board, 2, 0, 9 as Digit);
    expect(result.kind).toBe("conflict");
    if (result.kind === "conflict") {
      expect(result.conflicts).toContainEqual([1, 1]);
    }
  });
});
