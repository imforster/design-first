# Implementation Plan: Sudoku Game

## Overview

Build a Sudoku puzzle game using TypeScript, React, Tailwind CSS, DaisyUI, Vite, and Vitest with fast-check for property-based testing. Implementation proceeds bottom-up: core data types → validator → solver → generator → history → game controller → UI components → integration wiring.

## Tasks

- [x] 1. Set up project structure and core types
  - [x] 1.1 Initialize Vite project with React + TypeScript, install Tailwind CSS, DaisyUI, Vitest, and fast-check
    - Create Vite project with `react-ts` template
    - Install dependencies: `tailwindcss`, `daisyui`, `vitest`, `fast-check`, `@testing-library/react`
    - Configure `tailwind.config.ts` with DaisyUI plugin
    - Configure `vitest.config.ts`
    - _Requirements: 9.2_

  - [x] 1.2 Define core data types and utility functions
    - Create `src/types.ts` with `Digit`, `Cell`, `Board`, `Pos`, `Difficulty`, `ValidationResult`, `SolveResult`, `Move`, `History`, `GameState`, `GameSession` types
    - Create `src/utils.ts` with `getBox`, `isPeer`, `deepCloneBoard`, `createEmptyBoard`, `allPositions`, `getEmptyCells` helpers
    - _Requirements: 1.1, 1.5_

- [x] 2. Implement Board Manager
  - [x] 2.1 Implement Board Manager functions
    - Create `src/engine/board-manager.ts`
    - Implement `initBoard`, `getCell`, `setCell`, `clearCell`, `isGivenCell`, `togglePencilMark`, `isBoardComplete`
    - `initBoard` creates a 9×9 Board from a puzzle array, marking non-null cells as Given_Cells
    - `setCell` rejects modifications to Given_Cells and returns Board unchanged
    - `togglePencilMark` adds/removes a Digit from a Cell's pencil mark set
    - `isBoardComplete` returns true when all 81 Cells have a Digit value
    - Placing a Digit in a Cell with Pencil_Marks clears all Pencil_Marks
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2_

  - [x] 2.2 Write unit tests for Board Manager
    - Test `initBoard` creates correct Given_Cell flags
    - Test `setCell` rejects Given_Cell modification
    - Test `clearCell` sets value to null
    - Test `togglePencilMark` add/remove behavior
    - Test `isBoardComplete` with full and partial boards
    - Test placing a Digit clears Pencil_Marks
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2_

- [x] 3. Implement Validator
  - [x] 3.1 Implement Validator functions
    - Create `src/engine/validator.ts`
    - Implement `isRowValid`, `isColValid`, `isBoxValid`, `isBoardValid`, `isValidPlacement`, `getConflicts`
    - `isValidPlacement` checks row, column, and box peers for duplicate Digits
    - Returns `{ kind: "valid" }` or `{ kind: "conflict", conflicts: [...] }` with positions of all conflicting Peers
    - `isBoardValid` returns true iff all 9 rows, 9 columns, and 9 boxes have no duplicate Digits
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.2 Write property test: Constraints are complete (P7)
    - **Property 7: Row/col/box constraints are complete**
    - `isBoardValid(board)` iff all rows valid ∧ all cols valid ∧ all boxes valid
    - **Validates: Requirements 2.4**

  - [x] 3.3 Write property test: Candidates match valid placements (P8)
    - **Property 8: Candidates are exactly the valid digits for a cell**
    - For any board, position, and digit: `candidates(board, pos).has(d)` iff `isValidPlacement(board, pos.row, pos.col, d).kind === "valid"`
    - **Validates: Requirements 2.5**

  - [x] 3.4 Write property test: Valid placement produces valid board (P5)
    - **Property 5: Valid placement does not introduce conflicts**
    - If `isValidPlacement` returns valid, then `isBoardValid(setCell(board, row, col, digit))` is true
    - **Validates: Requirements 2.1, 2.2**

- [x] 4. Checkpoint - Core data layer
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Solver Engine
  - [x] 5.1 Implement constraint propagation and backtracking solver
    - Create `src/engine/solver.ts`
    - Implement `candidates`, `propagate`, `solve`, `countSolutions`, `getCandidates`
    - `propagate` fills naked singles iteratively, returns null on contradiction
    - `solve` uses propagation + backtracking with MRV heuristic
    - `countSolutions` counts solutions up to a limit (default 2) for uniqueness checking
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 2.5_

  - [x] 5.2 Implement hint functionality
    - Add `getHint` to solver: identifies one empty Cell and the correct Digit from the puzzle's unique solution
    - Returns `null` if board is complete or unsolvable
    - _Requirements: 7.1, 7.2_

  - [x] 5.3 Write property test: Solved board is valid (P1)
    - **Property 1: A solved board is always valid**
    - For any valid board, if `solve(board).kind === "solved"`, then `isBoardValid(solvedBoard)` is true
    - **Validates: Requirements 3.2**

  - [x] 5.4 Write property test: Solved board is complete (P2)
    - **Property 2: A solved board is always complete**
    - For any valid board, if `solve(board).kind === "solved"`, then `isBoardComplete(solvedBoard)` is true
    - **Validates: Requirements 3.2**

  - [x] 5.5 Write property test: Solving preserves givens (P3)
    - **Property 3: Solving preserves given cells**
    - For any board, if solved, all Given_Cell values in the original board match the solved board
    - **Validates: Requirements 3.3**

- [x] 6. Implement Puzzle Generator
  - [x] 6.1 Implement puzzle generation
    - Create `src/engine/generator.ts`
    - Implement `generateSolvedBoard` using solver with randomized candidate ordering
    - Implement `removeCells` that removes cells while maintaining unique solvability via `countSolutions`
    - Implement `generate(difficulty, seed?)` with target givens: Easy 35-40, Medium 28-34, Hard 22-27, Expert 17-21
    - Implement `estimateDifficulty` based on given cell count
    - Include seeded random number generator for reproducible puzzles
    - If target givens cannot be reached, return puzzle with more givens
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 6.2 Write property test: Generated puzzles have unique solution (P4)
    - **Property 4: Generated puzzles have exactly one solution**
    - For any difficulty, `countSolutions(generate(difficulty), 2) === 1`
    - **Validates: Requirements 4.1**

- [x] 7. Checkpoint - Solver and generator
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement History Manager
  - [x] 8.1 Implement History Manager functions
    - Create `src/engine/history-manager.ts`
    - Implement `pushMove`, `undo`, `redo`, `canUndo`, `canRedo`, `clear`
    - `pushMove` adds move to undo stack and clears redo stack
    - `undo` pops from undo stack, pushes to redo stack, returns the move
    - `redo` pops from redo stack, pushes to undo stack, returns the move
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 8.2 Write property test: Undo reverses last move (P6)
    - **Property 6: Undo reverses the last move exactly**
    - For any history and move, `undo(pushMove(history, move))` returns that move
    - **Validates: Requirements 5.2**

  - [x] 8.3 Write unit tests for History Manager
    - Test redo stack is cleared on new move
    - Test `canUndo`/`canRedo` with empty stacks
    - Test undo/redo sequence preserves move order
    - _Requirements: 5.4, 5.5, 5.6_

- [x] 9. Implement Game Controller
  - [x] 9.1 Implement Game Controller functions
    - Create `src/engine/game-controller.ts`
    - Implement `newGame`, `makeMove`, `undoMove`, `redoMove`, `requestHint`, `togglePencilMark`, `pause`, `resume`, `checkCompletion`
    - `newGame` generates puzzle, initializes board, resets history, sets elapsed to 0
    - `makeMove` validates via Validator, updates via Board Manager, records in History Manager
    - `makeMove` rejects moves on Given_Cells
    - `requestHint` delegates to Solver and increments hint counter
    - `pause`/`resume` transitions game state and controls timer
    - `checkCompletion` transitions to completed state when board is full and valid
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 7.3, 10.1_

  - [x] 9.2 Write unit tests for Game Controller
    - Test `newGame` initializes correct state
    - Test `makeMove` rejects Given_Cell modification
    - Test `makeMove` returns conflict info for invalid placements
    - Test pause/resume state transitions
    - Test completion detection
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 10. Checkpoint - Game engine complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement UI components
  - [x] 11.1 Create SudokuCell and SudokuBoard components
    - Create `src/components/SudokuCell.tsx` — renders a single cell with DaisyUI styling
    - Given_Cells styled with `bg-base-200` and distinct font weight
    - Selected cell highlighted with `btn-primary`
    - Conflict cells highlighted with `btn-error`
    - Peer cells (same row/col/box) get subtle highlight
    - Display pencil marks as small digits in a 3×3 sub-grid within the cell
    - Create `src/components/SudokuBoard.tsx` — renders 9×9 grid with thicker borders for 3×3 box boundaries
    - Use `card bg-base-100 shadow-xl` for board container
    - _Requirements: 9.1, 9.3, 9.4, 9.5_

  - [x] 11.2 Create DigitPad and GameControls components
    - Create `src/components/DigitPad.tsx` — buttons for digits 1-9, clear, and pencil mode toggle
    - Use `btn btn-outline` in a `btn-group` layout
    - Pencil mode toggle uses `btn-active` state
    - Create `src/components/GameControls.tsx` — undo, redo, hint, new game, pause buttons
    - Use `btn btn-sm` with DaisyUI variants (`btn-info` for hint, `btn-warning` for undo)
    - Disable undo/redo buttons when stacks are empty
    - _Requirements: 9.6, 9.7_

  - [x] 11.3 Create DifficultySelector, Timer, and CompletionModal components
    - Create `src/components/DifficultySelector.tsx` — `select select-bordered` dropdown for Easy/Medium/Hard/Expert
    - Create `src/components/Timer.tsx` — displays elapsed time using `badge badge-lg`, pauses when game is paused
    - Create `src/components/CompletionModal.tsx` — DaisyUI `modal` with `modal-box` showing elapsed time and hints used
    - _Requirements: 9.8, 9.9_

- [x] 12. Wire up App component and game state management
  - [x] 12.1 Implement main App component with React state management
    - Create `src/App.tsx` with game state managed via `useState`/`useReducer`
    - Wire DifficultySelector → Game Controller `newGame`
    - Wire SudokuBoard cell clicks → selected cell state
    - Wire DigitPad → Game Controller `makeMove` / `togglePencilMark`
    - Wire GameControls → undo/redo/hint/pause/newGame handlers
    - Implement timer with `useEffect` interval, respecting pause state
    - Show menu screen when `gameState.kind === "menu"`
    - Show game board when `gameState.kind === "playing"`
    - Show completion modal when `gameState.kind === "completed"`
    - Display conflict highlighting from validation results
    - Display warning tooltip on Given_Cell modification attempts
    - Display warning alert when no hint is available
    - Apply DaisyUI theme support with `data-theme` attribute
    - Use `min-h-screen bg-base-200` for page layout
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4, 9.10, 10.1, 10.2, 10.3_

  - [x] 12.2 Write integration tests for game flow
    - Test full flow: select difficulty → generate puzzle → make moves → undo → hint → complete
    - Test conflict highlighting appears and clears correctly
    - Test Given_Cell shows locked indicator on modification attempt
    - _Requirements: 8.1, 8.4, 8.5, 10.1, 10.2, 10.3_

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (P1-P8)
- Unit tests validate specific examples and edge cases
- All code uses TypeScript with React, Tailwind CSS, DaisyUI, Vite, Vitest, and fast-check
