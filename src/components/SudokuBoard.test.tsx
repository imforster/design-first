import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SudokuBoard } from "./SudokuBoard";
import type { Board, Cell, Digit } from "../types";

function makeEmptyBoard(): Board {
  return Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, (): Cell => ({
      value: null,
      isGiven: false,
      pencilMarks: new Set<Digit>(),
    }))
  );
}

describe("SudokuBoard", () => {
  it("renders 81 cells", () => {
    const { container } = render(
      <SudokuBoard
        board={makeEmptyBoard()}
        selectedPos={null}
        conflicts={[]}
        onCellClick={() => {}}
      />
    );
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBe(81);
  });

  it("wraps board in card bg-base-100 shadow-xl", () => {
    const { container } = render(
      <SudokuBoard
        board={makeEmptyBoard()}
        selectedPos={null}
        conflicts={[]}
        onCellClick={() => {}}
      />
    );
    const card = container.querySelector(".card")!;
    expect(card.className).toContain("bg-base-100");
    expect(card.className).toContain("shadow-xl");
  });

  it("calls onCellClick with correct row and col", () => {
    const handleClick = vi.fn();
    const { container } = render(
      <SudokuBoard
        board={makeEmptyBoard()}
        selectedPos={null}
        conflicts={[]}
        onCellClick={handleClick}
      />
    );
    const buttons = container.querySelectorAll("button");
    // Click cell at row 2, col 3 (index = 2*9 + 3 = 21)
    fireEvent.click(buttons[21]);
    expect(handleClick).toHaveBeenCalledWith(2, 3);
  });

  it("highlights selected cell with btn-primary", () => {
    const board = makeEmptyBoard();
    board[1][1] = { value: 5, isGiven: false, pencilMarks: new Set() };
    const { container } = render(
      <SudokuBoard
        board={board}
        selectedPos={{ row: 1, col: 1 }}
        conflicts={[]}
        onCellClick={() => {}}
      />
    );
    // Cell at index 1*9 + 1 = 10
    const btn = container.querySelectorAll("button")[10];
    expect(btn.className).toContain("btn-primary");
  });

  it("highlights conflict cells with btn-error", () => {
    const board = makeEmptyBoard();
    board[0][0] = { value: 3, isGiven: false, pencilMarks: new Set() };
    board[0][5] = { value: 3, isGiven: false, pencilMarks: new Set() };
    const { container } = render(
      <SudokuBoard
        board={board}
        selectedPos={null}
        conflicts={[[0, 0], [0, 5]]}
        onCellClick={() => {}}
      />
    );
    const btn0 = container.querySelectorAll("button")[0];
    const btn5 = container.querySelectorAll("button")[5];
    expect(btn0.className).toContain("btn-error");
    expect(btn5.className).toContain("btn-error");
  });

  it("highlights peer cells when a cell is selected", () => {
    const board = makeEmptyBoard();
    const { container } = render(
      <SudokuBoard
        board={board}
        selectedPos={{ row: 0, col: 0 }}
        conflicts={[]}
        onCellClick={() => {}}
      />
    );
    // Cell (0,1) is a peer (same row) — index 1
    const peerBtn = container.querySelectorAll("button")[1];
    expect(peerBtn.className).toContain("bg-base-300/30");

    // Cell (5,5) is NOT a peer — index 5*9+5 = 50
    const nonPeerBtn = container.querySelectorAll("button")[50];
    expect(nonPeerBtn.className).not.toContain("bg-base-300/30");
  });

  it("applies thicker borders at 3x3 box boundaries", () => {
    const { container } = render(
      <SudokuBoard
        board={makeEmptyBoard()}
        selectedPos={null}
        conflicts={[]}
        onCellClick={() => {}}
      />
    );
    const gridCells = container.querySelectorAll("[role='gridcell']");
    // Cell (0,0) should have border-t-2 and border-l-2
    expect(gridCells[0].className).toContain("border-t-2");
    expect(gridCells[0].className).toContain("border-l-2");
    // Cell (0,1) should have border-t-2 but border-l (not border-l-2)
    expect(gridCells[1].className).toContain("border-t-2");
    expect(gridCells[1].className).toContain("border-l");
    expect(gridCells[1].className).not.toContain("border-l-2");
    // Cell (3,0) should have border-t-2 (box boundary row)
    expect(gridCells[27].className).toContain("border-t-2");
  });

  it("renders the grid with role='grid'", () => {
    const { container } = render(
      <SudokuBoard
        board={makeEmptyBoard()}
        selectedPos={null}
        conflicts={[]}
        onCellClick={() => {}}
      />
    );
    const grid = container.querySelector("[role='grid']");
    expect(grid).toBeTruthy();
  });
});
