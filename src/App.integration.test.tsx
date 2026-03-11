import { render, screen, fireEvent, within, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Board, Digit } from "./types";
import App from "./App";

/**
 * Integration tests for the Sudoku game flow.
 *
 * Validates: Requirements 8.1, 8.4, 8.5, 10.1, 10.2, 10.3
 *
 * We mock the puzzle generator to return a deterministic, nearly-complete
 * puzzle so tests run fast and we can control exactly which cells are empty.
 */

// A known valid solved board (standard Sudoku solution)
const SOLVED_BOARD: (Digit | null)[][] = [
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

/**
 * Build a puzzle board from the solved board with specific cells emptied.
 * emptyCells is an array of [row, col] positions to leave empty.
 */
function buildPuzzle(emptyCells: [number, number][]): Board {
  const emptySet = new Set(emptyCells.map(([r, c]) => `${r},${c}`));
  return SOLVED_BOARD.map((row, r) =>
    row.map((val, c) => ({
      value: emptySet.has(`${r},${c}`) ? null : (val as Digit),
      isGiven: !emptySet.has(`${r},${c}`),
      pencilMarks: new Set<Digit>(),
    }))
  );
}

// Mock the generator to return our deterministic puzzle
vi.mock("./engine/generator", async () => {
  const actual = await vi.importActual<typeof import("./engine/generator")>(
    "./engine/generator"
  );
  return {
    ...actual,
    generate: vi.fn(),
  };
});

import { generate } from "./engine/generator";
const mockGenerate = vi.mocked(generate);

/**
 * Helper: get the button inside a specific grid cell by position (row, col).
 * The board renders cells in row-major order as gridcell elements.
 */
function getCellButton(row: number, col: number): HTMLButtonElement {
  const gridCells = screen.getAllByRole("gridcell");
  const index = row * 9 + col;
  const cell = gridCells[index];
  return within(cell).getByRole("button") as HTMLButtonElement;
}

/** Helper: click a cell on the board by grid position */
function clickCellAt(row: number, col: number) {
  fireEvent.click(getCellButton(row, col));
}

/** Helper: click a digit button */
function clickDigit(digit: number) {
  fireEvent.click(screen.getByLabelText(`Digit ${digit}`));
}

/** Helper: start a game by selecting Easy difficulty */
function startGame(emptyCells: [number, number][]) {
  const puzzle = buildPuzzle(emptyCells);
  mockGenerate.mockReturnValue(puzzle);
  render(<App />);
  const select = screen.getByRole("combobox");
  fireEvent.change(select, { target: { value: "easy" } });
}

describe("App Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Full game flow: new game → moves → undo → hint → complete", () => {
    /**
     * Validates: Requirements 8.1, 8.4, 8.5
     */
    it("completes a full game flow from start to finish", () => {
      // Puzzle with 3 empty cells: (0,0)=5, (0,1)=3, (4,4)=5
      const emptyCells: [number, number][] = [
        [0, 0],
        [0, 1],
        [4, 4],
      ];
      startGame(emptyCells);

      // 8.1: Board is rendered, timer starts at 00:00
      expect(screen.getByText("Sudoku")).toBeInTheDocument();
      expect(screen.getByLabelText("Sudoku board")).toBeInTheDocument();
      expect(screen.getByText("00:00")).toBeInTheDocument();

      // Verify empty cells are present
      expect(screen.getAllByLabelText("Empty cell").length).toBe(3);

      // 8.5: Make a move — place digit 5 at (0,0)
      clickCellAt(0, 0);
      clickDigit(5);

      // Cell (0,0) should now show value 5
      const cell00 = getCellButton(0, 0);
      expect(cell00.textContent).toBe("5");
      // Now only 2 empty cells remain
      expect(screen.getAllByLabelText("Empty cell").length).toBe(2);

      // Undo the move
      const undoBtn = screen.getByText("Undo");
      expect(undoBtn).not.toBeDisabled();
      fireEvent.click(undoBtn);

      // Cell should be empty again — 3 empty cells
      expect(screen.getAllByLabelText("Empty cell").length).toBe(3);

      // Use hint to fill one cell
      fireEvent.click(screen.getByText("Hint"));

      // Hint fills one empty cell, so 2 empty cells remain
      expect(screen.getAllByLabelText("Empty cell").length).toBe(2);

      // The hint fills (0,0) with 5 (first empty cell).
      // Remaining empty: (0,1)=3 and (4,4)=5
      // Fill (0,1) with 3
      clickCellAt(0, 1);
      clickDigit(3);
      expect(screen.getAllByLabelText("Empty cell").length).toBe(1);

      // Fill (4,4) with 5
      clickCellAt(4, 4);
      clickDigit(5);

      // 8.4: All cells filled and board valid → completion modal appears
      expect(screen.getByText("🎉 Congratulations!")).toBeInTheDocument();
      expect(screen.getByText("You completed the puzzle!")).toBeInTheDocument();
      expect(screen.getByText("Hints used: 1")).toBeInTheDocument();
    });

    it("initializes with elapsed time at zero on new game (Req 8.1)", () => {
      startGame([[0, 0]]);
      expect(screen.getByText("00:00")).toBeInTheDocument();
    });

    it("resets history on new game — undo is disabled (Req 8.1)", () => {
      startGame([[0, 0]]);
      expect(screen.getByText("Undo")).toBeDisabled();
    });
  });

  describe("Conflict highlighting (Req 10.2)", () => {
    /**
     * Validates: Requirements 10.2
     */
    it("highlights conflicting cells on invalid placement and clears on undo", () => {
      // Empty cell at (0,0) — correct value is 5
      // Row 0 has 3 at (0,1), so placing 3 at (0,0) creates a row conflict
      startGame([[0, 0]]);

      clickCellAt(0, 0);
      clickDigit(3); // 3 conflicts with (0,1) which has given 3

      // The conflicting cell at (0,1) should have btn-error class
      const conflictCell = getCellButton(0, 1);
      expect(conflictCell.className).toContain("btn-error");

      // Undo clears the conflict
      fireEvent.click(screen.getByText("Undo"));

      const clearedCell = getCellButton(0, 1);
      expect(clearedCell.className).not.toContain("btn-error");
    });

    it("allows overwriting a conflicting cell with a valid digit", () => {
      startGame([[0, 0]]);

      // Place conflicting digit
      clickCellAt(0, 0);
      clickDigit(3); // conflict with (0,1)

      // Verify conflict exists
      expect(getCellButton(0, 1).className).toContain("btn-error");

      // Overwrite with the correct digit
      clickCellAt(0, 0);
      clickDigit(5); // correct digit, no conflict

      // Conflicts should be cleared — no btn-error on (0,1)
      expect(getCellButton(0, 1).className).not.toContain("btn-error");
    });
  });

  describe("Given cell locked indicator (Req 10.1)", () => {
    /**
     * Validates: Requirements 10.1
     */
    it("shows locked warning when attempting to modify a given cell", () => {
      startGame([[0, 0]]);

      // Click a given cell at (0,1) which has value 3
      clickCellAt(0, 1);
      // Try to place a digit on it
      clickDigit(7);

      // Warning alert should appear
      expect(
        screen.getByText("This cell is locked and cannot be modified.")
      ).toBeInTheDocument();
    });

    it("auto-dismisses the locked warning after timeout", () => {
      startGame([[0, 0]]);

      clickCellAt(0, 1);
      clickDigit(7);

      expect(
        screen.getByText("This cell is locked and cannot be modified.")
      ).toBeInTheDocument();

      // Advance timers past the 2-second auto-dismiss
      act(() => {
        vi.advanceTimersByTime(2100);
      });

      expect(
        screen.queryByText("This cell is locked and cannot be modified.")
      ).not.toBeInTheDocument();
    });
  });

  describe("No hint available warning (Req 10.3)", () => {
    /**
     * Validates: Requirements 10.3
     */
    it("shows warning when no hint is available on a complete board", () => {
      // Start with no empty cells — board is already complete
      startGame([]);

      fireEvent.click(screen.getByText("Hint"));

      expect(screen.getByText("No hint available.")).toBeInTheDocument();
    });
  });
});
