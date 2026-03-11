export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface Cell {
  value: Digit | null;
  isGiven: boolean;
  pencilMarks: Set<Digit>;
}

/** 9×9 grid, Board[row][col] */
export type Board = Cell[][];

export interface Pos {
  row: number; // 0-8
  col: number; // 0-8
}

export const Difficulty = {
  Easy: "easy",
  Medium: "medium",
  Hard: "hard",
  Expert: "expert",
} as const;

export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

export type ValidationResult =
  | { kind: "valid" }
  | { kind: "conflict"; conflicts: [number, number][] };

export type SolveResult =
  | { kind: "solved"; board: Board }
  | { kind: "noSolution" }
  | { kind: "multipleSolutions" };

export interface Move {
  row: number;
  col: number;
  oldValue: Digit | null;
  newValue: Digit | null;
  oldPencilMarks: Set<Digit>;
  newPencilMarks: Set<Digit>;
}

export interface History {
  undoStack: Move[];
  redoStack: Move[];
}

export type GameState =
  | { kind: "menu" }
  | { kind: "playing"; board: Board; history: History; elapsed: number }
  | { kind: "paused"; board: Board; history: History; elapsed: number }
  | { kind: "completed"; board: Board; elapsed: number };

export interface GameSession {
  puzzle: Board;
  current: Board;
  solution: Board;
  difficulty: Difficulty;
  history: History;
  elapsedSeconds: number;
  hintsUsed: number;
}
