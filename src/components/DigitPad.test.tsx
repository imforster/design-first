import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DigitPad } from "./DigitPad";
import type { Digit } from "../types";

describe("DigitPad", () => {
  const defaultProps = {
    onDigit: vi.fn(),
    onClear: vi.fn(),
    onPencilToggle: vi.fn(),
    pencilMode: false,
  };

  it("renders buttons for digits 1-9", () => {
    render(<DigitPad {...defaultProps} />);
    for (let d = 1; d <= 9; d++) {
      expect(screen.getByLabelText(`Digit ${d}`)).toBeDefined();
    }
  });

  it("calls onDigit with the correct digit when clicked", () => {
    const onDigit = vi.fn();
    render(<DigitPad {...defaultProps} onDigit={onDigit} />);
    fireEvent.click(screen.getByLabelText("Digit 5"));
    expect(onDigit).toHaveBeenCalledWith(5 as Digit);
  });

  it("renders a Clear button that calls onClear", () => {
    const onClear = vi.fn();
    render(<DigitPad {...defaultProps} onClear={onClear} />);
    fireEvent.click(screen.getByText("Clear"));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("renders a Pencil toggle button that calls onPencilToggle", () => {
    const onPencilToggle = vi.fn();
    render(<DigitPad {...defaultProps} onPencilToggle={onPencilToggle} />);
    fireEvent.click(screen.getByText(/Pencil/));
    expect(onPencilToggle).toHaveBeenCalledOnce();
  });

  it("applies btn-active class when pencilMode is true", () => {
    render(<DigitPad {...defaultProps} pencilMode={true} />);
    const pencilBtn = screen.getByText(/Pencil/);
    expect(pencilBtn.className).toContain("btn-active");
  });

  it("does not apply btn-active class when pencilMode is false", () => {
    render(<DigitPad {...defaultProps} pencilMode={false} />);
    const pencilBtn = screen.getByText(/Pencil/);
    expect(pencilBtn.className).not.toContain("btn-active");
  });

  it("sets aria-pressed on pencil toggle based on pencilMode", () => {
    const { rerender } = render(<DigitPad {...defaultProps} pencilMode={false} />);
    expect(screen.getByText(/Pencil/).getAttribute("aria-pressed")).toBe("false");

    rerender(<DigitPad {...defaultProps} pencilMode={true} />);
    expect(screen.getByText(/Pencil/).getAttribute("aria-pressed")).toBe("true");
  });
});
