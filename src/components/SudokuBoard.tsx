import type { Board, Pos } from "../types";
import { isPeer } from "../utils";
import { SudokuCell } from "./SudokuCell";

export interface SudokuBoardProps {
  board: Board;
  selectedPos: Pos | null;
  conflicts: [number, number][];
  onCellClick: (row: number, col: number) => void;
}

export function SudokuBoard({
  board,
  selectedPos,
  conflicts,
  onCellClick,
}: SudokuBoardProps) {
  const conflictSet = new Set(conflicts.map(([r, c]) => `${r},${c}`));

  const isConflict = (row: number, col: number) =>
    conflictSet.has(`${row},${col}`);

  const isSelected = (row: number, col: number) =>
    selectedPos !== null &&
    selectedPos.row === row &&
    selectedPos.col === col;

  const isCellPeer = (row: number, col: number) =>
    selectedPos !== null &&
    !isSelected(row, col) &&
    isPeer(selectedPos, { row, col });

  /** Compute border classes for 3×3 box boundaries */
  const borderClasses = (row: number, col: number) => {
    const classes: string[] = [];
    classes.push(row % 3 === 0 ? "border-t-2" : "border-t");
    classes.push(col % 3 === 0 ? "border-l-2" : "border-l");
    if (row === 8) classes.push("border-b-2");
    if (col === 8) classes.push("border-r-2");
    return classes.join(" ");
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body p-2 sm:p-4">
        <div
          className="grid grid-cols-9 grid-rows-9 border-2 border-base-content aspect-square max-w-md mx-auto w-full"
          role="grid"
          aria-label="Sudoku board"
        >
          {board.map((row, r) =>
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                className={`border-base-content ${borderClasses(r, c)} aspect-square`}
                role="gridcell"
              >
                <SudokuCell
                  cell={cell}
                  isSelected={isSelected(r, c)}
                  isConflict={isConflict(r, c)}
                  isPeer={isCellPeer(r, c)}
                  onClick={() => onCellClick(r, c)}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
