import type { Board, Cell, Pos } from "./types";

/** The 3×3 box a position belongs to */
export function getBox(pos: Pos): { boxRow: number; boxCol: number } {
  return {
    boxRow: Math.floor(pos.row / 3),
    boxCol: Math.floor(pos.col / 3),
  };
}

/** Two positions are peers if they share a row, column, or box (but not the same position) */
export function isPeer(a: Pos, b: Pos): boolean {
  if (a.row === b.row && a.col === b.col) return false;
  if (a.row === b.row) return true;
  if (a.col === b.col) return true;
  const boxA = getBox(a);
  const boxB = getBox(b);
  return boxA.boxRow === boxB.boxRow && boxA.boxCol === boxB.boxCol;
}

/** Deep copy of a Board, cloning each Cell and its pencilMarks Set */
export function deepCloneBoard(board: Board): Board {
  return board.map((row) =>
    row.map((cell) => ({
      value: cell.value,
      isGiven: cell.isGiven,
      pencilMarks: new Set(cell.pencilMarks),
    }))
  );
}

/** Create a 9×9 board of empty cells */
export function createEmptyBoard(): Board {
  const board: Board = [];
  for (let r = 0; r < 9; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < 9; c++) {
      row.push({ value: null, isGiven: false, pencilMarks: new Set() });
    }
    board.push(row);
  }
  return board;
}

/** Array of all 81 Pos objects */
export function allPositions(): Pos[] {
  const positions: Pos[] = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      positions.push({ row, col });
    }
  }
  return positions;
}

/** Array of Pos for cells with null value */
export function getEmptyCells(board: Board): Pos[] {
  const empties: Pos[] = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col].value === null) {
        empties.push({ row, col });
      }
    }
  }
  return empties;
}
