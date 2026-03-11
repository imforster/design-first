import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GameControls } from "./GameControls";

describe("GameControls", () => {
  const defaultProps = {
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onHint: vi.fn(),
    onNewGame: vi.fn(),
    onPause: vi.fn(),
    canUndo: true,
    canRedo: true,
  };

  it("renders all control buttons", () => {
    render(<GameControls {...defaultProps} />);
    expect(screen.getByText("Undo")).toBeDefined();
    expect(screen.getByText("Redo")).toBeDefined();
    expect(screen.getByText("Hint")).toBeDefined();
    expect(screen.getByText("New Game")).toBeDefined();
    expect(screen.getByText("Pause")).toBeDefined();
  });

  it("calls onUndo when Undo is clicked", () => {
    const onUndo = vi.fn();
    render(<GameControls {...defaultProps} onUndo={onUndo} />);
    fireEvent.click(screen.getByText("Undo"));
    expect(onUndo).toHaveBeenCalledOnce();
  });

  it("calls onRedo when Redo is clicked", () => {
    const onRedo = vi.fn();
    render(<GameControls {...defaultProps} onRedo={onRedo} />);
    fireEvent.click(screen.getByText("Redo"));
    expect(onRedo).toHaveBeenCalledOnce();
  });

  it("calls onHint when Hint is clicked", () => {
    const onHint = vi.fn();
    render(<GameControls {...defaultProps} onHint={onHint} />);
    fireEvent.click(screen.getByText("Hint"));
    expect(onHint).toHaveBeenCalledOnce();
  });

  it("calls onNewGame when New Game is clicked", () => {
    const onNewGame = vi.fn();
    render(<GameControls {...defaultProps} onNewGame={onNewGame} />);
    fireEvent.click(screen.getByText("New Game"));
    expect(onNewGame).toHaveBeenCalledOnce();
  });

  it("calls onPause when Pause is clicked", () => {
    const onPause = vi.fn();
    render(<GameControls {...defaultProps} onPause={onPause} />);
    fireEvent.click(screen.getByText("Pause"));
    expect(onPause).toHaveBeenCalledOnce();
  });

  it("disables Undo button when canUndo is false", () => {
    render(<GameControls {...defaultProps} canUndo={false} />);
    expect(screen.getByText("Undo")).toHaveProperty("disabled", true);
  });

  it("disables Redo button when canRedo is false", () => {
    render(<GameControls {...defaultProps} canRedo={false} />);
    expect(screen.getByText("Redo")).toHaveProperty("disabled", true);
  });

  it("enables Undo and Redo when stacks are not empty", () => {
    render(<GameControls {...defaultProps} canUndo={true} canRedo={true} />);
    expect(screen.getByText("Undo")).toHaveProperty("disabled", false);
    expect(screen.getByText("Redo")).toHaveProperty("disabled", false);
  });

  it("applies correct DaisyUI button variants", () => {
    render(<GameControls {...defaultProps} />);
    expect(screen.getByText("Undo").className).toContain("btn-warning");
    expect(screen.getByText("Redo").className).toContain("btn-warning");
    expect(screen.getByText("Hint").className).toContain("btn-info");
    expect(screen.getByText("New Game").className).toContain("btn-success");
    expect(screen.getByText("Pause").className).toContain("btn-sm");
  });
});
