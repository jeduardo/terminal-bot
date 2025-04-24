import { useState, useRef, useEffect } from 'react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'

import { Cursor } from './components/Cursor'

export default function App() {
  const [lines, setLines] = useState([])
  const [input, setInput] = useState('')
  const [bootComplete, setBootComplete] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isProcessing, setIsProcessing] = useState(true)
  const [commandPrompt, setCommandPrompt] = useState('C:\\> ')
  const hasBooted = useRef(false)
  const terminalEnd = useRef(null)
  const inputRef = useRef(null)
  const formRef = useRef(null)

  // Helper to normalize the prompt ending
  function normalizePrompt(prompt) {    if (!prompt) return 'C:\\> '
    let trimmed = prompt.replace(/[\s>]+$/, '')
    return trimmed + '> '
  }

  // Auto‑scroll on new lines
  useEffect(() => {
    terminalEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  // Display all messages as streaming messages
  async function streamMessage(message, speed = 30) {
    const messageIdx = await new Promise(resolve => {
      setLines(prev => {
        resolve(prev.length)
        return [...prev, '']
      })
    })

    for (const ch of message) {
      await new Promise(r => setTimeout(r, speed))
      setLines(prev => {
        const copy = [...prev]
        copy[messageIdx] = (copy[messageIdx] ?? '') + ch
        return copy
      })
    }
    return messageIdx
  }

  // Modified boot sequence
  useEffect(() => {
    if (hasBooted.current) return
    hasBooted.current = true

    const getBootMessages = async () => {
      setIsProcessing(true)
      const res = await fetch('/api/boot', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        await streamMessage(`Error: Server error (${res.status}) - Please try again later`)
        return
      }

      setIsProcessing(false)
      return res.json();
    }

    const fetchBootMessages = async () => {
      // Add an empty line to show the blinking cursor
      setLines([''])

      const response = await getBootMessages()
      setLines([]) // Clear the blinking cursor

      if (!response) return
      setCommandPrompt(normalizePrompt(response.commandPrompt))
      const bootMsgs = response.response

      // Add a blank line to separate boot messages from the command prompt
      if (bootMsgs && bootMsgs.length > 0 && bootMsgs[bootMsgs.length - 1] !== '') {
        bootMsgs.push('')
      }

      setIsStreaming(true)
      for (const msg of bootMsgs) {
        await streamMessage(msg)
        await new Promise(r => setTimeout(r, 500))
      }
      setIsStreaming(false)
      setBootComplete(true)
    }

    fetchBootMessages()
  }, [])

  // Add focus handler effect
  useEffect(() => {
    const handleFocus = () => {
      inputRef.current?.focus()
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('click', handleFocus)

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('click', handleFocus)
    }
  }, [])

  // Modified AI response handling
  async function getCommandResponse(command) {
    // Show blinking cursor while waiting for response
    setLines(prev => [...prev, ''])
    setIsProcessing(true)

    let res
    try {
      res = await fetch('/api/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: command, currentPrompt: commandPrompt }),
      })
    } catch (err) {
      await streamMessage('Error: Connection failed - Please check your network connection')
      return
    } finally {
      setLines(prev => prev.slice(0, -1)) // Remove blinking cursor
      setIsProcessing(false)
    }

    if (!res.ok) {
      await streamMessage(`Error: Server error (${res.status}) - Please try again later`)
      return
    }

    // ...after fetch...
    const data = await res.json()
    const linesArr = data.response || []

    setIsStreaming(true)
    for (const line of linesArr) {
      await streamMessage(line)
    }
    setIsStreaming(false)

    // Set the command prompt
    setCommandPrompt(normalizePrompt(data.commandPrompt))

    // Focus the input after command completes
    inputRef.current?.focus()
  }

  // On Enter: echo → loader/API → show prompt again
  const handleSubmit = async e => {
    e.preventDefault()
    if (!input) return

    // Hide the form immediately
    if (formRef.current) {
      formRef.current.style.visibility = 'hidden'
    }

    setIsStreaming(true)
    setLines(prev => [...prev, commandPrompt + input])
    const msg = input
    setInput('')
    await getCommandResponse(msg)
    setIsStreaming(false)

    // Show the form again after processing
    if (formRef.current) {
      formRef.current.style.visibility = 'visible'
      // Focus input after form becomes visible
      inputRef.current?.focus()
    }
  }

  return (
    <div className="crt">
      <div className="terminal">
        {lines.map((line, i) => {
          const isLastLine = i === lines.length - 1
          const isEmptyLine = line === ''

          // Show the cursor when:
          // - it is the last line AND it is streaming text
          // - it is the last line AND it is processing
          const showCursor = isLastLine && (isStreaming || isProcessing)

          // Show empty line character when:
          // - line is empty AND
          // - ((not the last line) OR (last line AND not streaming AND not processing))
          const showEmptyLine = isEmptyLine && (!isLastLine || (isLastLine && !isStreaming && !isProcessing))

          return (
            <pre key={i} className="terminal-line" style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ whiteSpace: 'pre' }}>
                {showEmptyLine ? '\u00A0' : line}
                <Cursor hidden={!showCursor} blink={isProcessing}/>
              </span>
            </pre>
          )
        })}

        {/* show only after boot AND when not streaming */}
        {bootComplete && (
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              alignItems: 'center',
              visibility: isStreaming ? 'hidden' : 'visible', // <-- Hide when streaming
            }}
          >
            <span style={{ whiteSpace: 'pre' }}>{commandPrompt}</span>
            <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
              <input
                ref={inputRef}
                className="terminal-input"
                autoFocus
                value={input}
                autoCapitalize="none"
                autoCorrect="false"
                spellCheck="false"
                autoComplete="off"
                onChange={e => setInput(e.target.value)}
              />
              <Cursor blink={true} input={true} inputLength={input.length} />
            </div>
          </form>
        )}

        <div ref={terminalEnd} />
      </div>
      {/* Vercel-specific metric collectors */}
      <Analytics />
      <SpeedInsights />
    </div>
  )
}
