import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CompletionModal } from "./CompletionModal";

describe("CompletionModal", () => {
  const defaultProps = {
    open: true,
    elapsed: 125,
    hintsUsed: 3,
    onNewGame: vi.fn(),
  };

  it("renders with modal-open class when open", () => {
    const { container } = render(<CompletionModal {...defaultProps} />);
    const dialog = container.querySelector("dialog");
    expect(dialog?.className).toContain("modal-open");
  });

  it("does not have modal-open class when closed", () => {
    const { container } = render(
      <CompletionModal {...defaultProps} open={false} />
    );
    const dialog = container.querySelector("dialog");
    expect(dialog?.className).not.toContain("modal-open");
  });

  it("renders modal-box inside the dialog", () => {
    const { container } = render(<CompletionModal {...defaultProps} />);
    expect(container.querySelector(".modal-box")).toBeDefined();
  });

  it("displays congratulations message", () => {
    render(<CompletionModal {...defaultProps} />);
    expect(screen.getByText(/Congratulations/)).toBeDefined();
  });

  it("displays elapsed time formatted as MM:SS", () => {
    render(<CompletionModal {...defaultProps} elapsed={125} />);
    expect(screen.getByText("Time: 02:05")).toBeDefined();
  });

  it("displays hints used count", () => {
    render(<CompletionModal {...defaultProps} hintsUsed={3} />);
    expect(screen.getByText("Hints used: 3")).toBeDefined();
  });

  it("calls onNewGame when New Game button is clicked", () => {
    const onNewGame = vi.fn();
    render(<CompletionModal {...defaultProps} onNewGame={onNewGame} />);
    fireEvent.click(screen.getByText("New Game"));
    expect(onNewGame).toHaveBeenCalledOnce();
  });
});
