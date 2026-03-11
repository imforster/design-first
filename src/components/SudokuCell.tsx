import type { Cell, Digit } from "../types";

export interface SudokuCellProps {
  cell: Cell;
  isSelected: boolean;
  isConflict: boolean;
  isPeer: boolean;
  onClick: () => void;
}

const PENCIL_POSITIONS: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function SudokuCell({
  cell,
  isSelected,
  isConflict,
  isPeer,
  onClick,
}: SudokuCellProps) {
  const baseClasses = "btn btn-ghost btn-square w-full h-full min-h-0 p-0 rounded-none text-lg";

  const stateClasses = isSelected
    ? "btn-primary"
    : isConflict
      ? "btn-error"
      : cell.isGiven
        ? "bg-base-200 font-bold"
        : isPeer
          ? "bg-base-300/30"
          : "";

  const hasPencilMarks = cell.value === null && cell.pencilMarks.size > 0;

  return (
    <button
      className={`${baseClasses} ${stateClasses}`}
      onClick={onClick}
      aria-label={
        cell.value
          ? `Cell value ${cell.value}${cell.isGiven ? ", given" : ""}`
          : "Empty cell"
      }
    >
      {cell.value ? (
        <span>{cell.value}</span>
      ) : hasPencilMarks ? (
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full">
          {PENCIL_POSITIONS.map((d) => (
            <span
              key={d}
              className="text-[0.5rem] leading-none flex items-center justify-center opacity-60"
            >
              {cell.pencilMarks.has(d) ? d : ""}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  );
}
