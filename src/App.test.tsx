import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "./App";

// Mock the game controller's newGame to avoid slow puzzle generation in tests
vi.mock("./engine/game-controller", async () => {
  const actual = await vi.importActual<typeof import("./engine/game-controller")>(
    "./engine/game-controller"
  );
  return {
    ...actual,
  };
});

describe("App", () => {
  it("renders the menu screen with title and difficulty selector", () => {
    render(<App />);
    expect(screen.getByText("Sudoku Game")).toBeInTheDocument();
    expect(
      screen.getByText("Select a difficulty to start a new game")
    ).toBeInTheDocument();
    expect(screen.getByText("Select Difficulty")).toBeInTheDocument();
  });

  it("renders difficulty options in the selector", () => {
    render(<App />);
    expect(screen.getByText("Easy")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("Hard")).toBeInTheDocument();
    expect(screen.getByText("Expert")).toBeInTheDocument();
  });

  it("applies DaisyUI theme and layout classes", () => {
    const { container } = render(<App />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("min-h-screen", "bg-base-200");
    expect(root).toHaveAttribute("data-theme", "light");
  });
});
