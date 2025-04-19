#!/usr/bin/env node
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import { google } from '@ai-sdk/google'
import { streamText } from 'ai'

dotenv.config({ path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env' })

const MODEL  = `${process.env.GOOGLE_GENERATIVE_AI_MODEL}`
const PROMPT = `${process.env.MODEL_PROMPT}`.replaceAll("\n", " ");
const FRONTEND_DIR = `${process.env.FRONTEND_DIR}`


const app = express()
app.use(cors())
app.use(express.json())

console.log(`🤖 Server using model ${MODEL}`)
console.log(`💬 Server using prompt: "${PROMPT}"`)

if (FRONTEND_DIR !== 'undefined') {
  app.use(express.static(FRONTEND_DIR))
  console.log(`🌎 Frontend app served from "${FRONTEND_DIR}"`)
}

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

app.post('/api/chat', async (req, res) => {
  const { message } = req.body

  try {
    const result = streamText({
      model: google(MODEL),
      messages: [
      { role: 'system',  content: PROMPT},
      { role: 'user', content: message }
      ]
    })    
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')

    for await (const token of result.textStream) {
      console.log(token)
      res.write(token)
    }
    res.end()
  } catch (err) {
    console.error('AI request failed', err)
    res.status(500).send('AI request failed')
  }
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`)
})
