# Requirements Document

## Introduction

This document defines the requirements for a Sudoku puzzle game built with TypeScript, React, and DaisyUI. The game allows players to generate, play, and solve standard 9×9 Sudoku puzzles with features including multiple difficulty levels, real-time validation, pencil marks, undo/redo, hints, and an automatic solver. Requirements are derived from the approved design document and follow EARS notation with INCOSE quality standards.

## Glossary

- **Board**: A 9×9 grid of Cells representing the Sudoku puzzle state
- **Cell**: A single position on the Board containing a value (1-9 or empty), a given flag, and pencil marks
- **Digit**: An integer value from 1 to 9
- **Given_Cell**: A Cell whose value is part of the original puzzle and cannot be modified by the player
- **Pencil_Mark**: A candidate Digit noted by the player in an empty Cell
- **Peer**: A Cell that shares the same row, column, or 3×3 box as another Cell
- **Conflict**: A state where two Peer Cells contain the same Digit
- **Board_Manager**: The component responsible for managing Board state and Cell operations
- **Validator**: The component responsible for checking Sudoku constraints (row, column, box)
- **Solver_Engine**: The component that solves puzzles using constraint propagation and backtracking
- **Puzzle_Generator**: The component that creates puzzles with unique solutions at specified difficulty levels
- **History_Manager**: The component that tracks player moves for undo/redo support
- **Game_Controller**: The component that orchestrates game flow and connects UI events to subsystems
- **Difficulty**: One of four levels (Easy, Medium, Hard, Expert) controlling the number of Given_Cells
- **MRV_Heuristic**: Minimum Remaining Values heuristic — selecting the empty Cell with the fewest candidate Digits for backtracking
- **Constraint_Propagation**: A technique that fills Cells with only one valid candidate (naked singles) iteratively
- **UI_Layer**: The React + DaisyUI presentation layer that renders the Board and accepts player input

## Requirements

### Requirement 1: Board State Management

**User Story:** As a player, I want the game to maintain an accurate board state, so that my moves and the puzzle's given cells are tracked correctly.

#### Acceptance Criteria

1. WHEN a puzzle is initialized, THE Board_Manager SHALL create a 9×9 Board where each Cell provided by the puzzle is marked as a Given_Cell with its corresponding Digit value
2. WHEN a player places a Digit in an empty Cell, THE Board_Manager SHALL produce a new Board with the specified Cell updated to the placed Digit
3. WHEN a player attempts to modify a Given_Cell, THE Board_Manager SHALL reject the modification and return the Board unchanged
4. WHEN a player clears a non-given Cell, THE Board_Manager SHALL produce a new Board with that Cell's value set to empty
5. WHEN all 81 Cells on the Board contain a Digit, THE Board_Manager SHALL report the Board as complete

### Requirement 2: Sudoku Constraint Validation

**User Story:** As a player, I want real-time feedback on my moves, so that I can see when a placed digit conflicts with existing digits.

#### Acceptance Criteria

1. WHEN a player places a Digit in a Cell, THE Validator SHALL check the Cell's row, column, and 3×3 box for any Peer containing the same Digit
2. WHEN no Peer contains the same Digit, THE Validator SHALL return a valid result
3. WHEN one or more Peers contain the same Digit, THE Validator SHALL return a conflict result listing the positions of all conflicting Peers
4. THE Validator SHALL report a Board as valid if and only if all 9 rows, all 9 columns, and all 9 boxes each contain no duplicate Digits
5. WHEN computing candidates for an empty Cell, THE Solver_Engine SHALL return exactly the set of Digits that do not conflict with any Peer of that Cell

### Requirement 3: Puzzle Solving

**User Story:** As a player, I want the game to be able to solve puzzles, so that I can receive hints and verify solutions.

#### Acceptance Criteria

1. WHEN a valid Board is provided, THE Solver_Engine SHALL attempt to find a complete solution using Constraint_Propagation followed by backtracking with the MRV_Heuristic
2. WHEN a solution exists, THE Solver_Engine SHALL return a Board that is both complete (all 81 Cells filled) and valid (no constraint violations)
3. WHEN a solution exists, THE Solver_Engine SHALL preserve all Given_Cell values from the original Board in the solved Board
4. WHEN no valid completion exists for the Board, THE Solver_Engine SHALL return a no-solution result
5. WHEN counting solutions, THE Solver_Engine SHALL return the number of distinct solutions up to a specified limit

### Requirement 4: Puzzle Generation

**User Story:** As a player, I want to generate new puzzles at different difficulty levels, so that I can play games matching my skill level.

#### Acceptance Criteria

1. WHEN a player requests a new puzzle with a specified Difficulty, THE Puzzle_Generator SHALL produce a Board with exactly one solution
2. WHEN generating an Easy puzzle, THE Puzzle_Generator SHALL produce a Board with approximately 35 to 40 Given_Cells
3. WHEN generating a Medium puzzle, THE Puzzle_Generator SHALL produce a Board with approximately 28 to 34 Given_Cells
4. WHEN generating a Hard puzzle, THE Puzzle_Generator SHALL produce a Board with approximately 22 to 27 Given_Cells
5. WHEN generating an Expert puzzle, THE Puzzle_Generator SHALL produce a Board with approximately 17 to 21 Given_Cells
6. WHERE a seed value is provided, THE Puzzle_Generator SHALL produce the same puzzle for the same Difficulty and seed combination
7. IF the cell removal process cannot reach the target number of Given_Cells while maintaining a unique solution, THEN THE Puzzle_Generator SHALL return the puzzle with more Given_Cells than the target

### Requirement 5: Undo and Redo

**User Story:** As a player, I want to undo and redo my moves, so that I can correct mistakes without restarting the puzzle.

#### Acceptance Criteria

1. WHEN a player makes a move, THE History_Manager SHALL record the move including the Cell position, old value, new value, old Pencil_Marks, and new Pencil_Marks
2. WHEN a player requests an undo, THE History_Manager SHALL return the most recent move and transfer the move from the undo stack to the redo stack
3. WHEN a player requests a redo, THE History_Manager SHALL return the most recent undone move and transfer the move from the redo stack to the undo stack
4. WHEN a player makes a new move after undoing, THE History_Manager SHALL clear the redo stack
5. WHILE the undo stack is empty, THE History_Manager SHALL report that undo is not available
6. WHILE the redo stack is empty, THE History_Manager SHALL report that redo is not available

### Requirement 6: Pencil Marks

**User Story:** As a player, I want to note candidate digits in empty cells, so that I can track my reasoning while solving the puzzle.

#### Acceptance Criteria

1. WHEN a player toggles a Pencil_Mark for a Digit on an empty Cell, THE Board_Manager SHALL add the Digit to the Cell's Pencil_Mark set if not present, or remove the Digit if already present
2. WHEN a player places a Digit in a Cell that has Pencil_Marks, THE Board_Manager SHALL clear all Pencil_Marks from that Cell

### Requirement 7: Hints

**User Story:** As a player, I want to request hints, so that I can get help when I am stuck on a puzzle.

#### Acceptance Criteria

1. WHEN a player requests a hint, THE Solver_Engine SHALL identify one empty Cell and the correct Digit for that Cell based on the puzzle's unique solution
2. IF the Board is already complete or in an unsolvable state, THEN THE Solver_Engine SHALL return no hint
3. WHEN a hint is provided, THE Game_Controller SHALL increment the hint counter for the current game session

### Requirement 8: Game Flow Management

**User Story:** As a player, I want to start, pause, resume, and complete games, so that I can manage my play sessions.

#### Acceptance Criteria

1. WHEN a player starts a new game, THE Game_Controller SHALL initialize the Board from the generated puzzle, reset the History_Manager, and set elapsed time to zero
2. WHEN a player pauses the game, THE Game_Controller SHALL transition the game state from playing to paused and stop the elapsed time counter
3. WHEN a player resumes the game, THE Game_Controller SHALL transition the game state from paused to playing and resume the elapsed time counter
4. WHEN all Cells are filled and the Board is valid, THE Game_Controller SHALL transition the game state to completed and record the final elapsed time
5. WHEN a move is made, THE Game_Controller SHALL delegate validation to the Validator and board updates to the Board_Manager

### Requirement 9: User Interface Rendering

**User Story:** As a player, I want a clean and responsive interface, so that I can interact with the puzzle comfortably.

#### Acceptance Criteria

1. THE UI_Layer SHALL render the Board as a 9×9 grid with visually distinct 3×3 box boundaries using thicker borders
2. THE UI_Layer SHALL style all components using DaisyUI component classes and Tailwind CSS utility classes
3. WHEN a Cell is selected, THE UI_Layer SHALL highlight the selected Cell, its row, its column, and its 3×3 box
4. WHEN a Cell has a Conflict, THE UI_Layer SHALL display the Cell with error styling to indicate the violation
5. THE UI_Layer SHALL display Given_Cells with distinct styling to differentiate them from player-filled Cells
6. THE UI_Layer SHALL provide a digit input pad with buttons for Digits 1 through 9, a clear action, and a pencil mode toggle
7. THE UI_Layer SHALL provide game control buttons for undo, redo, hint, new game, and pause actions
8. THE UI_Layer SHALL display a timer showing the elapsed time for the current game session
9. WHEN a player completes the puzzle, THE UI_Layer SHALL display a completion modal with the elapsed time
10. THE UI_Layer SHALL support DaisyUI theme switching for light and dark mode

### Requirement 10: Error Handling

**User Story:** As a player, I want the game to handle edge cases gracefully, so that my experience is not disrupted by unexpected states.

#### Acceptance Criteria

1. WHEN a player attempts to modify a Given_Cell, THE UI_Layer SHALL display a visual indicator informing the player that the Cell is locked
2. WHEN a digit placement results in a Conflict, THE UI_Layer SHALL highlight all conflicting Cells and allow the player to undo or overwrite
3. IF no hint is available, THEN THE UI_Layer SHALL display a warning message informing the player that no hint can be provided
