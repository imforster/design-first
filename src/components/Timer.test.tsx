import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Timer } from "./Timer";

describe("Timer", () => {
  it("renders elapsed time formatted as MM:SS", () => {
    render(<Timer elapsed={65} paused={false} />);
    expect(screen.getByText("01:05")).toBeDefined();
  });

  it("renders zero time as 00:00", () => {
    render(<Timer elapsed={0} paused={false} />);
    expect(screen.getByText("00:00")).toBeDefined();
  });

  it("formats large times correctly", () => {
    render(<Timer elapsed={3661} paused={false} />);
    expect(screen.getByText("61:01")).toBeDefined();
  });

  it("applies badge badge-lg class", () => {
    render(<Timer elapsed={0} paused={false} />);
    const badge = screen.getByText("00:00");
    expect(badge.className).toContain("badge");
    expect(badge.className).toContain("badge-lg");
  });

  it("shows paused indicator when paused", () => {
    const { container } = render(<Timer elapsed={30} paused={true} />);
    expect(container.textContent).toContain("⏸");
  });

  it("does not show paused indicator when not paused", () => {
    const { container } = render(<Timer elapsed={30} paused={false} />);
    expect(container.textContent).not.toContain("⏸");
  });
});
