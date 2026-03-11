import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SudokuCell } from "./SudokuCell";
import type { Cell, Digit } from "../types";

function makeCell(overrides: Partial<Cell> = {}): Cell {
  return {
    value: null,
    isGiven: false,
    pencilMarks: new Set<Digit>(),
    ...overrides,
  };
}

describe("SudokuCell", () => {
  it("renders a digit value", () => {
    render(
      <SudokuCell
        cell={makeCell({ value: 5 })}
        isSelected={false}
        isConflict={false}
        isPeer={false}
        onClick={() => {}}
      />
    );
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders empty when no value and no pencil marks", () => {
    const { container } = render(
      <SudokuCell
        cell={makeCell()}
        isSelected={false}
        isConflict={false}
        isPeer={false}
        onClick={() => {}}
      />
    );
    const btn = container.querySelector("button")!;
    expect(btn.textContent).toBe("");
  });

  it("applies btn-primary class when selected", () => {
    const { container } = render(
      <SudokuCell
        cell={makeCell({ value: 3 })}
        isSelected={true}
        isConflict={false}
        isPeer={false}
        onClick={() => {}}
      />
    );
    const btn = container.querySelector("button")!;
    expect(btn.className).toContain("btn-primary");
  });

  it("applies btn-error class when conflict", () => {
    const { container } = render(
      <SudokuCell
        cell={makeCell({ value: 7 })}
        isSelected={false}
        isConflict={true}
        isPeer={false}
        onClick={() => {}}
      />
    );
    const btn = container.querySelector("button")!;
    expect(btn.className).toContain("btn-error");
  });

  it("applies bg-base-200 and font-bold for given cells", () => {
    const { container } = render(
      <SudokuCell
        cell={makeCell({ value: 9, isGiven: true })}
        isSelected={false}
        isConflict={false}
        isPeer={false}
        onClick={() => {}}
      />
    );
    const btn = container.querySelector("button")!;
    expect(btn.className).toContain("bg-base-200");
    expect(btn.className).toContain("font-bold");
  });

  it("applies bg-base-300/30 for peer cells", () => {
    const { container } = render(
      <SudokuCell
        cell={makeCell({ value: 2 })}
        isSelected={false}
        isConflict={false}
        isPeer={true}
        onClick={() => {}}
      />
    );
    const btn = container.querySelector("button")!;
    expect(btn.className).toContain("bg-base-300/30");
  });

  it("renders pencil marks as a 3x3 sub-grid", () => {
    const marks = new Set<Digit>([1, 5, 9]);
    const { container } = render(
      <SudokuCell
        cell={makeCell({ pencilMarks: marks })}
        isSelected={false}
        isConflict={false}
        isPeer={false}
        onClick={() => {}}
      />
    );
    const grid = container.querySelector(".grid-cols-3")!;
    expect(grid).toBeTruthy();
    expect(grid.textContent).toContain("1");
    expect(grid.textContent).toContain("5");
    expect(grid.textContent).toContain("9");
    expect(grid.textContent).not.toContain("3");
  });

  it("selected takes priority over conflict styling", () => {
    const { container } = render(
      <SudokuCell
        cell={makeCell({ value: 4 })}
        isSelected={true}
        isConflict={true}
        isPeer={false}
        onClick={() => {}}
      />
    );
    const btn = container.querySelector("button")!;
    expect(btn.className).toContain("btn-primary");
    expect(btn.className).not.toContain("btn-error");
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(
      <SudokuCell
        cell={makeCell({ value: 1 })}
        isSelected={false}
        isConflict={false}
        isPeer={false}
        onClick={handleClick}
      />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
