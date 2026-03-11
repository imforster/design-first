import { describe, it, expect } from "vitest";
import {
  initBoard,
  getCell,
  setCell,
  clearCell,
  isGivenCell,
  togglePencilMark,
  isBoardComplete,
} from "./board-manager";
import type { Digit } from "../types";

/** Helper: creates a 9×9 null puzzle array */
function emptyPuzzle(): (Digit | null)[][] {
  return Array.from({ length: 9 }, () => Array(9).fill(null));
}

describe("initBoard", () => {
  it("creates a 9×9 board from a puzzle array", () => {
    const puzzle = emptyPuzzle();
    puzzle[0][0] = 5;
    puzzle[4][4] = 9;
    const board = initBoard(puzzle);

    expect(board.length).toBe(9);
    expect(board[0].length).toBe(9);
    expect(board[0][0].value).toBe(5);
    expect(board[0][0].isGiven).toBe(true);
    expect(board[4][4].value).toBe(9);
    expect(board[4][4].isGiven).toBe(true);
  });

  it("marks null cells as non-given with no value", () => {
    const puzzle = emptyPuzzle();
    const board = initBoard(puzzle);

    expect(board[0][0].value).toBeNull();
    expect(board[0][0].isGiven).toBe(false);
    expect(board[0][0].pencilMarks.size).toBe(0);
  });
});

describe("getCell", () => {
  it("returns the cell at the given position", () => {
    const puzzle = emptyPuzzle();
    puzzle[2][3] = 7;
    const board = initBoard(puzzle);

    const cell = getCell(board, 2, 3);
    expect(cell.value).toBe(7);
    expect(cell.isGiven).toBe(true);
  });
});

describe("setCell", () => {
  it("places a digit in an empty cell", () => {
    const board = initBoard(emptyPuzzle());
    const newBoard = setCell(board, 0, 0, 5);

    expect(newBoard[0][0].value).toBe(5);
    expect(newBoard[0][0].isGiven).toBe(false);
  });

  it("returns a new board (immutability)", () => {
    const board = initBoard(emptyPuzzle());
    const newBoard = setCell(board, 0, 0, 5);

    expect(newBoard).not.toBe(board);
    expect(board[0][0].value).toBeNull();
  });

  it("rejects modification of a Given_Cell and returns board unchanged", () => {
    const puzzle = emptyPuzzle();
    puzzle[0][0] = 5;
    const board = initBoard(puzzle);
    const result = setCell(board, 0, 0, 9);

    expect(result).toBe(board); // same reference — unchanged
    expect(result[0][0].value).toBe(5);
  });

  it("clears pencil marks when placing a digit", () => {
    const board = initBoard(emptyPuzzle());
    const withMarks = togglePencilMark(board, 0, 0, 3);
    const withMoreMarks = togglePencilMark(withMarks, 0, 0, 7);

    expect(withMoreMarks[0][0].pencilMarks.size).toBe(2);

    const afterSet = setCell(withMoreMarks, 0, 0, 5);
    expect(afterSet[0][0].value).toBe(5);
    expect(afterSet[0][0].pencilMarks.size).toBe(0);
  });
});

describe("clearCell", () => {
  it("clears a non-given cell's value", () => {
    const board = initBoard(emptyPuzzle());
    const withValue = setCell(board, 1, 1, 3);
    const cleared = clearCell(withValue, 1, 1);

    expect(cleared[1][1].value).toBeNull();
  });

  it("does not modify a Given_Cell", () => {
    const puzzle = emptyPuzzle();
    puzzle[0][0] = 5;
    const board = initBoard(puzzle);
    const result = clearCell(board, 0, 0);

    expect(result).toBe(board);
    expect(result[0][0].value).toBe(5);
  });
});

describe("isGivenCell", () => {
  it("returns true for given cells", () => {
    const puzzle = emptyPuzzle();
    puzzle[3][3] = 8;
    const board = initBoard(puzzle);

    expect(isGivenCell(board, 3, 3)).toBe(true);
  });

  it("returns false for non-given cells", () => {
    const board = initBoard(emptyPuzzle());
    expect(isGivenCell(board, 0, 0)).toBe(false);
  });
});

describe("togglePencilMark", () => {
  it("adds a pencil mark to an empty cell", () => {
    const board = initBoard(emptyPuzzle());
    const result = togglePencilMark(board, 0, 0, 3);

    expect(result[0][0].pencilMarks.has(3)).toBe(true);
  });

  it("removes a pencil mark if already present", () => {
    const board = initBoard(emptyPuzzle());
    const added = togglePencilMark(board, 0, 0, 3);
    const removed = togglePencilMark(added, 0, 0, 3);

    expect(removed[0][0].pencilMarks.has(3)).toBe(false);
  });

  it("does not modify a Given_Cell", () => {
    const puzzle = emptyPuzzle();
    puzzle[0][0] = 5;
    const board = initBoard(puzzle);
    const result = togglePencilMark(board, 0, 0, 3);

    expect(result).toBe(board);
  });

  it("does not modify a cell that already has a value", () => {
    const board = initBoard(emptyPuzzle());
    const withValue = setCell(board, 0, 0, 5);
    const result = togglePencilMark(withValue, 0, 0, 3);

    expect(result).toBe(withValue);
  });
});

describe("isBoardComplete", () => {
  it("returns false for an empty board", () => {
    const board = initBoard(emptyPuzzle());
    expect(isBoardComplete(board)).toBe(false);
  });

  it("returns false for a partially filled board", () => {
    const board = initBoard(emptyPuzzle());
    const partial = setCell(board, 0, 0, 1);
    expect(isBoardComplete(partial)).toBe(false);
  });

  it("returns true when all 81 cells have a digit", () => {
    const puzzle: (Digit | null)[][] = [];
    // Fill with a simple pattern (not necessarily valid Sudoku, just complete)
    const digits: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let r = 0; r < 9; r++) {
      const row: Digit[] = [];
      for (let c = 0; c < 9; c++) {
        row.push(digits[(r * 3 + Math.floor(r / 3) + c) % 9]);
      }
      puzzle.push(row);
    }
    const board = initBoard(puzzle);
    expect(isBoardComplete(board)).toBe(true);
  });
});
