import express from "express";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import {
  MODEL,
  MODEL_PROMPT,
  BOOT_PROMPT,
  TEMPERATURE,
  MAX_TOKENS,
} from "./config.js";

const router = express.Router();

const RESPONSE_SCHEMA = z.object({
  commandPrompt: z.string(),
  response: z.array(z.string()),
});

router.get("/api/boot", async (_, res) => {
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
    const error = {
      commandPrompt: "C:\\> ",
      response: ["Failure", err.message],
    };
    res.status(500).send(error);
  }
});

router.post("/api/system", async (req, res) => {
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
      const error = {
        commandPrompt: "C:\\> ",
        response: ["Failure", err.message],
      };
      return res.status(500).send(error);
    }
  }
});

export default router;
