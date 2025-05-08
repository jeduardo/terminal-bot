import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, vi, test, describe } from "vitest";
import "@testing-library/jest-dom";
import App from "./App";

// Mock scrollIntoView to prevent errors during testing as jsdom does not implement it
// https://stackoverflow.com/questions/53271193/typeerror-scrollintoview-is-not-a-function
window.HTMLElement.prototype.scrollIntoView = function () {};

// Mock the Client class and its methods
const mockCommandResponse = vi.fn().mockResolvedValue({
  prompt: "mocked prompt",
  lines: ["mocked line 1", "mocked line 2"],
});
const mockBootMessages = vi.fn().mockResolvedValue({
  prompt: "mocked prompt",
  lines: ["boot message 1", "boot message 2"],
});

vi.mock("./ai/Client", () => {
  return {
    default: vi.fn(() => ({
      getCommandResponse: mockCommandResponse,
      getBootMessages: mockBootMessages,
    })),
  };
});

describe("App component", () => {
  test("renders without crashing and shows prompt", async () => {
    render(<App />);

    // The first line will finish streaming after ~14 chars × 30ms ≈ 420ms.
    // The second line by ~840ms. findByText will poll up to its timeout (default 1000ms).
    expect(await screen.findByText("boot message 1")).toBeInTheDocument();
    expect(await screen.findByText("boot message 2")).toBeInTheDocument();

    expect(mockBootMessages).toHaveBeenCalledOnce();
  });

  test("calls inputHandler when terminal input is processed", async () => {
    const user = userEvent.setup();
    render(<App inputHandler={mockCommandResponse} />);

    // Simulate user input in the terminal
    const input = await screen.findByRole("textbox", {
      name: /terminal input/i,
    });

    await user.type(input, "test command"); // types each char
    await user.keyboard("{Enter}"); // then presses Enter

    expect(mockCommandResponse).toHaveBeenCalledOnce();

    // Wait for the inputHandler to resolve
    await screen.findByText(/mocked line 2/i);
    expect(screen.getByText(/mocked line 2/i)).toBeInTheDocument();
  });
});
