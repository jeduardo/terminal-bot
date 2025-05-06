import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Terminal from "./Terminal";

// Mock scrollIntoView to prevent errors during testing as jsdom does not implement it
// https://stackoverflow.com/questions/53271193/typeerror-scrollintoview-is-not-a-function
window.HTMLElement.prototype.scrollIntoView = function () {};

describe("Terminal Component", () => {
  const mockInputHandler = jest.fn().mockResolvedValue({
    prompt: "TerminalPrompt",
    lines: ["Response line 1", "Response line 2"],
  });
  const mockBootHandler = jest.fn().mockResolvedValue({
    prompt: "TerminalPrompt",
    lines: ["Boot message 1", "Boot message 2"],
  });

  beforeEach(() => {
    jest.clearAllMocks();
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
});
