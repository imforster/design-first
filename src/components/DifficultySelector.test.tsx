import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DifficultySelector } from "./DifficultySelector";
import { Difficulty } from "../types";

describe("DifficultySelector", () => {
  it("renders a select element with select-bordered class", () => {
    const onSelect = vi.fn();
    render(<DifficultySelector onSelect={onSelect} />);
    const select = screen.getByRole("combobox");
    expect(select.className).toContain("select");
    expect(select.className).toContain("select-bordered");
  });

  it("renders all difficulty options", () => {
    const onSelect = vi.fn();
    render(<DifficultySelector onSelect={onSelect} />);
    expect(screen.getByText("Easy")).toBeDefined();
    expect(screen.getByText("Medium")).toBeDefined();
    expect(screen.getByText("Hard")).toBeDefined();
    expect(screen.getByText("Expert")).toBeDefined();
  });

  it("renders a disabled placeholder option", () => {
    const onSelect = vi.fn();
    render(<DifficultySelector onSelect={onSelect} />);
    const placeholder = screen.getByText("Select Difficulty");
    expect(placeholder).toBeDefined();
    expect((placeholder as HTMLOptionElement).disabled).toBe(true);
  });

  it("calls onSelect with Difficulty.Easy when Easy is selected", () => {
    const onSelect = vi.fn();
    render(<DifficultySelector onSelect={onSelect} />);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: Difficulty.Easy },
    });
    expect(onSelect).toHaveBeenCalledWith(Difficulty.Easy);
  });

  it("calls onSelect with Difficulty.Expert when Expert is selected", () => {
    const onSelect = vi.fn();
    render(<DifficultySelector onSelect={onSelect} />);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: Difficulty.Expert },
    });
    expect(onSelect).toHaveBeenCalledWith(Difficulty.Expert);
  });
});
