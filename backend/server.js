#!/usr/bin/env node

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import morgan from 'morgan'

import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

dotenv.config({ path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env' })

const MODEL  = `${process.env.MODEL_NAME}`
const MODEL_PROMPT = `${process.env.MODEL_PROMPT}`.replaceAll("\n", " ");
const BOOT_PROMPT = `${process.env.BOOT_PROMPT}`.replaceAll("\n", " ");
const FRONTEND_DIR = `${process.env.FRONTEND_DIR}`
const TEMPERATURE = parseFloat(process.env.MODEL_TEMPERATURE)
const MAX_TOKENS = parseInt(process.env.MODEL_MAX_TOKENS)

const RESPONSE_SCHEMA = z.object({
  commandPrompt: z.string(),
  response: z.array(z.string()),
})

const app = express()
app.set('trust proxy', true)
app.use(morgan('combined'))
app.use(cors())
app.use(express.json())

console.log(`🤖 Model name: ${MODEL}`)
console.log(`💬 Model prompt: "${MODEL_PROMPT}"`)
console.log(`💬 Boot prompt: "${BOOT_PROMPT}"`)
console.log(`🌡️ Model temperature: "${TEMPERATURE}"`)
console.log(`📓 Max response tokens: "${MAX_TOKENS}"`)

if (FRONTEND_DIR !== 'undefined') {
  app.use(express.static(FRONTEND_DIR))
  console.log(`🌎 Frontend app served from: "${FRONTEND_DIR}"`)
}

app.get('/api/boot', async (_, res) => {
  try {
    const { object } = await generateObject({
      model: google(MODEL),
      temperature: TEMPERATURE,
      maxTokens: MAX_TOKENS,
      schema: RESPONSE_SCHEMA,
      maxRetries: 5,
      prompt: BOOT_PROMPT,
    })    
    res.status(200).send(object)
  } catch (err) {
    console.error('🚨 AI request failed', err)
    res.status(500).send('AI request failed')
  }
})

app.post('/api/system', async (req, res) => {
  const { command, history, currentPrompt } = req.body
  let retries = 0
  const maxRetries = 5

  // Process history to remove empty messages, as Gemini doesn't accept them
  const messages = []
  for (const msg of history) {
    if (msg.content === '') {
      console.warn(`⚠️ Found empty message in history, removing it: ${msg}`)
      continue
    }
    messages.push(msg)
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
          { role: 'system', content: MODEL_PROMPT},
          { role: 'system', content: `Consider the current command prompt: ${currentPrompt}` },
          ...messages,
          { role: 'user', content: command },
        ]
      })
      return res.status(200).send(object)
    } catch (err) {
      if (err.name === 'NoObjectGeneratedError' && retries < maxRetries - 1) {
        console.warn(`🔄 Retry ${retries + 1}/${maxRetries} due to NoObjectGeneratedError`)
        retries++
        continue
      }
      console.error('🚨 AI request failed', err)
      return res.status(500).send('AI request failed')
    }
  }
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`)
})
