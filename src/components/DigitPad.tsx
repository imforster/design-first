import type { Digit } from "../types";

export interface DigitPadProps {
  onDigit: (digit: Digit) => void;
  onClear: () => void;
  onPencilToggle: () => void;
  pencilMode: boolean;
}

const DIGITS: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function DigitPad({
  onDigit,
  onClear,
  onPencilToggle,
  pencilMode,
}: DigitPadProps) {
  return (
    <div className="flex flex-col gap-2 items-center">
      <div className="flex flex-wrap justify-center gap-1">
        {DIGITS.map((d) => (
          <button
            key={d}
            className="btn btn-outline btn-square"
            onClick={() => onDigit(d)}
            aria-label={`Digit ${d}`}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button className="btn btn-outline" onClick={onClear}>
          Clear
        </button>
        <button
          className={`btn btn-outline ${pencilMode ? "btn-active" : ""}`}
          onClick={onPencilToggle}
          aria-pressed={pencilMode}
        >
          ✏️ Pencil
        </button>
      </div>
    </div>
  );
}
