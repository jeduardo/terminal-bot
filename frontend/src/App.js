// src/App.js
import { useState, useRef, useEffect } from 'react'

export default function App() {
  const [lines, setLines] = useState([])
  const [input, setInput] = useState('')
  const [bootComplete, setBootComplete] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const hasBooted = useRef(false)
  const terminalEnd = useRef(null)
  const inputRef = useRef(null)

  // Auto‑scroll on new lines
  useEffect(() => {
    terminalEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  // Display all messages as streaming messages
  async function streamMessage(message, speed = 30) {
    let messageIdx
    setLines(prev => {
      messageIdx = prev.length
      return [...prev, '']
    })

    for (const ch of message) {
      await new Promise(r => setTimeout(r, speed))
      setLines(prev => {
        const copy = [...prev]
        copy[messageIdx] += ch
        return copy
      })
    }
    return messageIdx
  }

  // Modified boot sequence
  useEffect(() => {
    if (hasBooted.current) return
    hasBooted.current = true

    const bootMsgs = [
      'Initializing system...',
      'SYSBOOT complete',
      'Kernel loaded',
      'COM1: Ready',
      'Loading modules...',
      'HIMEM.SYS loaded',
      'Extended memory detected',
      '640K conventional memory available',
      'Ready.'
    ]

    ;(async () => {
      for (const msg of bootMsgs) {
        await streamMessage(msg)
        await new Promise(r => setTimeout(r, 500))
      }
      setBootComplete(true)
    })()
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
  async function streamAIResponse(message) {
    // 1) insert an empty loader line
    let loaderIdx
    setLines(prev => {
      loaderIdx = prev.length
      return [...prev, '']
    })
  
    // 2) start a rotating-dot interval (0→1→2→3→0…)
    let dotCount = 0
    const loaderInterval = setInterval(() => {
      dotCount = (dotCount + 1) % 4
      setLines(prev => {
        const copy = [...prev]
        copy[loaderIdx] = '.'.repeat(dotCount)
        return copy
      })
    }, 1000)
  
    // 3) now kick off the fetch
    let res
    try {
      res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
    } catch (err) {
      clearInterval(loaderInterval)
      setLines(prev => {
        const copy = [...prev]
        copy.splice(loaderIdx, 1)
        return copy
      })
      await streamMessage('Error: Connection failed - Please check your network connection')
      return
    }
  
    if (!res.ok) {
      clearInterval(loaderInterval)
      setLines(prev => {
        const copy = [...prev]
        copy.splice(loaderIdx, 1)
        return copy
      })
      await streamMessage(`Error: Server error (${res.status}) - Please try again later`)
      return
    }
  
    // 4) process the response
    const reader = res.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let fullResponse = ''

    // Collect the entire response
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      fullResponse += decoder.decode(value, { stream: true })
    }

    // Clear the loader
    clearInterval(loaderInterval)
    setLines(prev => {
      const copy = [...prev]
      copy.splice(loaderIdx, 1)
      return copy
    })

    // Split by newline tokens and stream each line
    const lines = fullResponse.split('|NEWLINE|')
    for (const line of lines) {
      if (line.trim()) {
        await streamMessage(line)
      }
    }
  }

  // On Enter: echo → loader/API → show prompt again
  const handleSubmit = async e => {
    e.preventDefault()
    if (!input) return

    setIsStreaming(true)
    // echo with arrow prefix
    setLines(prev => [...prev, 'C:\\> ' + input])
    const msg = input
    setInput('')
    await streamAIResponse(msg)
    setIsStreaming(false)
  }

  return (
    <div className="terminal">
      {lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}

      {/* show only after boot AND when not busy */}
      {bootComplete && !isStreaming && (
        <form onSubmit={handleSubmit}>
          <span>C:\&gt; </span>
          <input
            ref={inputRef}
            autoFocus
            value={input}
            autoCapitalize="none"
            onChange={e => setInput(e.target.value)}
          />
        </form>
      )}

      <div ref={terminalEnd} />
    </div>
  )
}
