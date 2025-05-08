import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import Terminal from "./Terminal";

// Mock scrollIntoView to prevent errors during testing as jsdom does not implement it
// https://stackoverflow.com/questions/53271193/typeerror-scrollintoview-is-not-a-function
window.HTMLElement.prototype.scrollIntoView = function () {};

describe("Terminal Component", () => {
  const mockInputHandler = vi.fn().mockResolvedValue({
    prompt: "TerminalPrompt",
    lines: ["Response line 1", "Response line 2"],
  });
  const mockBootHandler = vi.fn().mockResolvedValue({
    prompt: "TerminalPrompt",
    lines: ["Boot message 1", "Boot message 2"],
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the terminal with initial prompt", async () => {
    // wait for the boot handler to be called
    render(
      <Terminal
        inputHandler={mockInputHandler}
        bootHandler={mockBootHandler}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText("TerminalPrompt>")).toBeInTheDocument();
      expect(mockBootHandler).toHaveBeenCalled();
    });
  });

  it("displays boot messages on mount", async () => {
    render(
      <Terminal
        inputHandler={mockInputHandler}
        bootHandler={mockBootHandler}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText("Boot message 1")).toBeInTheDocument();
      expect(screen.getByText("Boot message 2")).toBeInTheDocument();
      expect(mockBootHandler).toHaveBeenCalled();
    });
  });

  test("calls inputHandler when terminal input is processed", async () => {
    const user = userEvent.setup();
    render(
      <Terminal
        inputHandler={mockInputHandler}
        bootHandler={mockBootHandler}
      />,
    );

    // Simulate user input in the terminal
    const input = await screen.findByRole("textbox", {
      name: /terminal input/i,
    });

    await user.type(input, "test command"); // types each char
    await user.keyboard("{Enter}"); // then presses Enter

    expect(mockInputHandler).toHaveBeenCalledOnce();

    // Wait for the inputHandler to resolve
    await screen.findByText(/response line 2/i);
    expect(screen.getByText(/response line 2/i)).toBeInTheDocument();
  });
});
