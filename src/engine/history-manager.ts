import type { History, Move } from "../types";

/** Creates an empty History with no undo/redo entries. */
export function createHistory(): History {
  return { undoStack: [], redoStack: [] };
}

/** Records a move: pushes onto the undo stack and clears the redo stack. */
export function pushMove(history: History, move: Move): History {
  return {
    undoStack: [...history.undoStack, move],
    redoStack: [],
  };
}

/** Pops the most recent move from the undo stack and pushes it to the redo stack. Returns null if nothing to undo. */
export function undo(history: History): { move: Move; history: History } | null {
  if (history.undoStack.length === 0) return null;

  const undoStack = [...history.undoStack];
  const move = undoStack.pop()!;

  return {
    move,
    history: {
      undoStack,
      redoStack: [...history.redoStack, move],
    },
  };
}

/** Pops the most recent move from the redo stack and pushes it to the undo stack. Returns null if nothing to redo. */
export function redo(history: History): { move: Move; history: History } | null {
  if (history.redoStack.length === 0) return null;

  const redoStack = [...history.redoStack];
  const move = redoStack.pop()!;

  return {
    move,
    history: {
      undoStack: [...history.undoStack, move],
      redoStack,
    },
  };
}

/** Returns true when there are moves available to undo. */
export function canUndo(history: History): boolean {
  return history.undoStack.length > 0;
}

/** Returns true when there are moves available to redo. */
export function canRedo(history: History): boolean {
  return history.redoStack.length > 0;
}

/** Clears both undo and redo stacks. */
export function clear(_history: History): History {
  return { undoStack: [], redoStack: [] };
}
