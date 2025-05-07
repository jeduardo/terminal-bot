import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables
dotenv.config({
  path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : ".env",
});

// Define a schema for environment variables
const envSchema = z.object({
  MODEL_NAME: z.string(),
  MODEL_PROMPT: z.string(),
  BOOT_PROMPT: z.string(),
  MODEL_TEMPERATURE: z.string().transform((val) => parseFloat(val)),
  MODEL_MAX_TOKENS: z.string().transform((val) => parseInt(val)),
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

export const MODEL = env.MODEL_NAME;
export const MODEL_PROMPT = env.MODEL_PROMPT.replaceAll("\n", " ");
export const BOOT_PROMPT = env.BOOT_PROMPT.replaceAll("\n", " ");
export const TEMPERATURE = env.MODEL_TEMPERATURE;
export const MAX_TOKENS = env.MODEL_MAX_TOKENS;
export const REMOTE_CALL_TIMEOUT = env.REMOTE_CALL_TIMEOUT
  ? parseInt(env.REMOTE_CALL_TIMEOUT)
  : 50000;

// Log configuration details
console.log(`🤖 Model name: ${MODEL}`);
console.log(`💬 Model prompt: "${MODEL_PROMPT}"`);
console.log(`💬 Boot prompt: "${BOOT_PROMPT}"`);
console.log(`🌡️ Model temperature: ${TEMPERATURE}`);
console.log(`📓 Max response tokens: ${MAX_TOKENS}`);
console.log(`⏰ Remote call timeout: ${REMOTE_CALL_TIMEOUT}`);
