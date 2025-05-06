import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";

// Mock the generateObject function
vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));

// Mock the google function
vi.mock("@ai-sdk/google", () => ({
  google: vi.fn(),
}));

dotenv.config({
  path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : ".env",
});

const MODEL = `${process.env.MODEL_NAME}`;
const MODEL_PROMPT = `${process.env.MODEL_PROMPT}`.replaceAll("\n", " ");
const BOOT_PROMPT = `${process.env.BOOT_PROMPT}`.replaceAll("\n", " ");
const TEMPERATURE = parseFloat(process.env.MODEL_TEMPERATURE);
const MAX_TOKENS = parseInt(process.env.MODEL_MAX_TOKENS);

const RESPONSE_SCHEMA = z.object({
  commandPrompt: z.string(),
  response: z.array(z.string()),
});

const app = express();
app.set("trust proxy", true);
app.use(morgan("combined"));
app.use(cors());
app.use(express.json());

app.get("/api/boot", async (_, res) => {
  try {
    const { object } = await generateObject({
      model: google(MODEL),
      temperature: TEMPERATURE,
      maxTokens: MAX_TOKENS,
      schema: RESPONSE_SCHEMA,
      maxRetries: 5,
      prompt: BOOT_PROMPT,
    });
    res.status(200).send(object);
  } catch (err) {
    console.error("🚨 AI request failed", err);
    res.status(500).send("AI request failed");
  }
});

app.post("/api/system", async (req, res) => {
  const { command, history, currentPrompt } = req.body;
  let retries = 0;
  const maxRetries = 5;

  const messages = [];
  for (const msg of history) {
    if (msg.content === "") {
      console.warn(`⚠️ Found empty message in history, removing it: ${msg}`);
      continue;
    }
    messages.push(msg);
  }

  while (retries < maxRetries) {
    try {
      const { object } = await generateObject({
        model: google(MODEL),
        temperature: TEMPERATURE,
        maxTokens: MAX_TOKENS,
        schema: RESPONSE_SCHEMA,
        maxRetries: 5,
        messages: [
          { role: "system", content: MODEL_PROMPT },
          {
            role: "system",
            content: `Consider the current command prompt: ${currentPrompt}`,
          },
          ...messages,
          { role: "user", content: command },
        ],
      });
      return res.status(200).send(object);
    } catch (err) {
      if (err.name === "NoObjectGeneratedError" && retries < maxRetries - 1) {
        console.warn(
          `🔄 Retry ${retries + 1}/${maxRetries} due to NoObjectGeneratedError`,
        );
        retries++;
        continue;
      }
      console.error("🚨 AI request failed", err);
      return res.status(500).send("AI request failed");
    }
  }
});

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
        schema: RESPONSE_SCHEMA,
        maxRetries: 5,
        prompt: BOOT_PROMPT,
      });
    });

    it("should return a 500 status if generateObject throws an error", async () => {
      generateObject.mockRejectedValueOnce(new Error("AI request failed"));

      const response = await request(app).get("/api/boot");

      expect(response.status).toBe(500);
      expect(response.text).toBe("AI request failed");
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
        schema: RESPONSE_SCHEMA,
        maxRetries: 5,
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
      expect(response.text).toBe("AI request failed");
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
      expect(response.text).toBe("AI request failed");
      expect(generateObject).toHaveBeenCalledTimes(5);
    });
  });
});
