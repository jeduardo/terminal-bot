import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import app from "../src/server.js";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import {
  MODEL,
  MODEL_PROMPT,
  BOOT_PROMPT,
  TEMPERATURE,
  MAX_TOKENS,
} from "../src/config.js";

// Mock the generateObject function
vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));

// Mock the google function
vi.mock("@ai-sdk/google", () => ({
  google: vi.fn(),
}));

describe("API Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/boot", () => {
    it("should return a 200 status and the generated object", async () => {
      const mockObject = { commandPrompt: "test", response: ["response"] };
      generateObject.mockResolvedValueOnce({ object: mockObject });

      const response = await request(app).get("/api/boot");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockObject);
      expect(generateObject).toHaveBeenCalledWith({
        model: google(MODEL),
        temperature: TEMPERATURE,
        maxTokens: MAX_TOKENS,
        schema: expect.any(Object),
        maxRetries: 5,
        abortSignal: expect.any(Object),
        prompt: BOOT_PROMPT,
      });
    });

    it("should return a 500 status if generateObject throws an error", async () => {
      generateObject.mockRejectedValueOnce(new Error("AI request failed"));

      const response = await request(app).get("/api/boot");

      expect(response.status).toBe(500);
      expect(response.text).toBe(
        JSON.stringify({
          commandPrompt: "C:\\> ",
          response: ["AI request failed"],
        }),
      );
    });
  });

  describe("POST /api/system", () => {
    it("should return a 200 status and the generated object", async () => {
      const mockObject = { commandPrompt: "test", response: ["response"] };
      generateObject.mockResolvedValueOnce({ object: mockObject });

      const response = await request(app)
        .post("/api/system")
        .send({
          command: "test command",
          history: [{ role: "user", content: "test history" }],
          currentPrompt: "test prompt",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockObject);
      expect(generateObject).toHaveBeenCalledWith({
        model: google(MODEL),
        temperature: TEMPERATURE,
        maxTokens: MAX_TOKENS,
        schema: expect.any(Object),
        maxRetries: 5,
        abortSignal: expect.any(Object),
        messages: [
          { role: "system", content: MODEL_PROMPT },
          {
            role: "system",
            content: "Consider the current command prompt: test prompt",
          },
          { role: "user", content: "test history" },
          { role: "user", content: "test command" },
        ],
      });
    });

    it("should return a 500 status if generateObject throws an error", async () => {
      generateObject.mockRejectedValueOnce(new Error("AI request failed"));

      const response = await request(app)
        .post("/api/system")
        .send({
          command: "test command",
          history: [{ role: "user", content: "test history" }],
          currentPrompt: "test prompt",
        });

      expect(response.status).toBe(500);
      expect(response.text).toBe(
        JSON.stringify({
          commandPrompt: "C:\\> ",
          response: ["AI request failed"],
        }),
      );
    });

    it("should retry on NoObjectGeneratedError and eventually fail", async () => {
      const error = new Error("NoObjectGeneratedError");
      error.name = "NoObjectGeneratedError";
      generateObject
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error);

      const response = await request(app)
        .post("/api/system")
        .send({
          command: "test command",
          history: [{ role: "user", content: "test history" }],
          currentPrompt: "test prompt",
        });

      expect(response.status).toBe(500);
      expect(response.text).toBe(
        JSON.stringify({
          commandPrompt: "C:\\> ",
          response: ["AI request failed"],
        }),
      );
      expect(generateObject).toHaveBeenCalledTimes(5);
    });
  });
});
