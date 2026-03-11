import { describe, it, expect } from "vitest";
import {
  createHistory,
  pushMove,
  undo,
  redo,
  canUndo,
  canRedo,
  clear,
} from "./history-manager";
import type { Move } from "../types";

function makeMove(row: number, col: number, oldVal: number | null, newVal: number | null): Move {
  return {
    row,
    col,
    oldValue: oldVal as Move["oldValue"],
    newValue: newVal as Move["newValue"],
    oldPencilMarks: new Set(),
    newPencilMarks: new Set(),
  };
}

describe("createHistory", () => {
  it("returns an empty history", () => {
    const h = createHistory();
    expect(h.undoStack).toEqual([]);
    expect(h.redoStack).toEqual([]);
  });
});

describe("pushMove", () => {
  it("adds a move to the undo stack", () => {
    const h = createHistory();
    const move = makeMove(0, 0, null, 5);
    const result = pushMove(h, move);

    expect(result.undoStack).toHaveLength(1);
    expect(result.undoStack[0]).toBe(move);
  });

  it("clears the redo stack when a new move is pushed", () => {
    let h = createHistory();
    h = pushMove(h, makeMove(0, 0, null, 5));
    h = pushMove(h, makeMove(1, 1, null, 3));

    // Undo one move to populate redo stack
    const undone = undo(h)!;
    expect(undone.history.redoStack).toHaveLength(1);

    // Push a new move — redo stack should be cleared
    const afterNew = pushMove(undone.history, makeMove(2, 2, null, 7));
    expect(afterNew.redoStack).toHaveLength(0);
    expect(afterNew.undoStack).toHaveLength(2);
  });

  it("does not mutate the original history", () => {
    const h = createHistory();
    const result = pushMove(h, makeMove(0, 0, null, 5));

    expect(h.undoStack).toHaveLength(0);
    expect(result.undoStack).toHaveLength(1);
  });
});

describe("undo", () => {
  it("returns null when undo stack is empty", () => {
    const h = createHistory();
    expect(undo(h)).toBeNull();
  });

  it("returns the most recent move and transfers it to redo stack", () => {
    const move1 = makeMove(0, 0, null, 5);
    const move2 = makeMove(1, 1, null, 3);
    let h = createHistory();
    h = pushMove(h, move1);
    h = pushMove(h, move2);

    const result = undo(h)!;
    expect(result.move).toBe(move2);
    expect(result.history.undoStack).toHaveLength(1);
    expect(result.history.redoStack).toHaveLength(1);
    expect(result.history.redoStack[0]).toBe(move2);
  });

  it("supports multiple consecutive undos", () => {
    const move1 = makeMove(0, 0, null, 5);
    const move2 = makeMove(1, 1, null, 3);
    let h = createHistory();
    h = pushMove(h, move1);
    h = pushMove(h, move2);

    const first = undo(h)!;
    expect(first.move).toBe(move2);

    const second = undo(first.history)!;
    expect(second.move).toBe(move1);
    expect(second.history.undoStack).toHaveLength(0);
    expect(second.history.redoStack).toHaveLength(2);
  });
});

describe("redo", () => {
  it("returns null when redo stack is empty", () => {
    const h = createHistory();
    expect(redo(h)).toBeNull();
  });

  it("returns the most recent undone move and transfers it to undo stack", () => {
    const move = makeMove(0, 0, null, 5);
    let h = pushMove(createHistory(), move);
    const undone = undo(h)!;

    const result = redo(undone.history)!;
    expect(result.move).toBe(move);
    expect(result.history.undoStack).toHaveLength(1);
    expect(result.history.redoStack).toHaveLength(0);
  });

  it("supports undo-redo-undo-redo round-trip", () => {
    const move = makeMove(3, 4, null, 9);
    let h = pushMove(createHistory(), move);

    const u = undo(h)!;
    const r = redo(u.history)!;
    expect(r.move).toBe(move);

    const u2 = undo(r.history)!;
    expect(u2.move).toBe(move);

    const r2 = redo(u2.history)!;
    expect(r2.move).toBe(move);
    expect(r2.history.undoStack).toHaveLength(1);
    expect(r2.history.redoStack).toHaveLength(0);
  });
});

describe("canUndo / canRedo", () => {
  it("reports undo not available on empty history", () => {
    expect(canUndo(createHistory())).toBe(false);
  });

  it("reports redo not available on empty history", () => {
    expect(canRedo(createHistory())).toBe(false);
  });

  it("reports undo available after a push", () => {
    const h = pushMove(createHistory(), makeMove(0, 0, null, 1));
    expect(canUndo(h)).toBe(true);
  });

  it("reports redo available after an undo", () => {
    let h = pushMove(createHistory(), makeMove(0, 0, null, 1));
    const undone = undo(h)!;
    expect(canRedo(undone.history)).toBe(true);
  });

  it("reports redo not available after a new push following undo", () => {
    let h = pushMove(createHistory(), makeMove(0, 0, null, 1));
    const undone = undo(h)!;
    const afterNew = pushMove(undone.history, makeMove(1, 1, null, 2));
    expect(canRedo(afterNew)).toBe(false);
  });
});

describe("clear", () => {
  it("empties both stacks", () => {
    let h = createHistory();
    h = pushMove(h, makeMove(0, 0, null, 5));
    h = pushMove(h, makeMove(1, 1, null, 3));
    const undone = undo(h)!;

    const cleared = clear(undone.history);
    expect(cleared.undoStack).toHaveLength(0);
    expect(cleared.redoStack).toHaveLength(0);
  });
});
