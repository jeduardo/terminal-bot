import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Client from "./Client";

describe("Client", () => {
  let client;

  beforeEach(() => {
    client = new Client();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getCommandResponse", () => {
    it("should return the command response and update message history", async () => {
      const mockResponse = {
        commandPrompt: "C:\\> ",
        response: ["Response line 1", "Response line 2"],
        prompt: "test prompt", // Ensure prompt is set in the mock response
      };

      global.fetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await client.getCommandResponse(
        "test prompt",
        "test command",
      );

      expect(result).toEqual({
        prompt: "C:\\> ",
        lines: ["Response line 1", "Response line 2"],
      });

      expect(client.messageHistory).toEqual([
        { role: "user", content: "test prompt" },
        { role: "assistant", content: "Response line 1\nResponse line 2" },
      ]);
    });

    it("should handle fetch errors", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Fetch error"));

      const result = await client.getCommandResponse(
        "test prompt",
        "test command",
      );

      expect(result).toEqual({
        prompt: "test prompt",
        lines: ["Fetch error"],
      });

      expect(client.messageHistory).toEqual([]);
    });
  });

  describe("getBootMessages", () => {
    it("should return boot messages and update message history", async () => {
      const mockResponse = {
        commandPrompt: "C:\\> ",
        response: ["Boot message 1", "Boot message 2"],
      };

      global.fetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await client.getBootMessages();

      expect(result).toEqual({
        prompt: "C:\\> ",
        lines: ["Boot message 1", "Boot message 2"],
      });

      expect(client.messageHistory).toEqual([
        { role: "assistant", content: "Boot message 1\nBoot message 2" },
      ]);
    });

    it("should handle fetch errors", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Fetch error"));

      const result = await client.getBootMessages();

      expect(result).toEqual({
        prompt: "C:\\> ",
        lines: ["Fetch error"],
      });

      expect(client.messageHistory).toEqual([]);
    });
  });
});
