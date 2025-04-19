// src/App.js
import { useState, useRef, useEffect } from 'react'

export default function App() {
  const [lines, setLines] = useState([])
  const [input, setInput] = useState('')
  const [bootComplete, setBootComplete] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const hasBooted = useRef(false)
  const terminalEnd = useRef(null)

  // Auto‑scroll on new lines
  useEffect(() => {
    terminalEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  // One‑time, streamed boot sequence
  useEffect(() => {
    if (hasBooted.current) return
    hasBooted.current = true

    const bootMsgs = [
      'Initializing system...',
      'Loading modules...',
      'Ready.'
    ]

    ;(async () => {
      for (const msg of bootMsgs) {
        let idx
        // add empty line and capture its index
        setLines(prev => { idx = prev.length; return [...prev, ''] })
        // type it out
        for (const ch of msg) {
          await new Promise(r => setTimeout(r, 30))
          setLines(prev => {
            const copy = [...prev]
            copy[idx] += ch
            return copy
          })
        }
        // pause before next
        await new Promise(r => setTimeout(r, 500))
      }
      setBootComplete(true)
    })()
  }, [])

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
        return [...copy, 'Error: Connection failed - Please check your network connection']
      })
      return
    }
  
    if (!res.ok) {
      setLines(prev => [...prev, `Error: Server error (${res.status}) - Please try again later`])
      clearInterval(loaderInterval)
      return
    }
  
    // 4) once fetch returns, stop the loader and remove its line
    clearInterval(loaderInterval)
    setLines(prev => {
      const copy = [...prev]
      copy.splice(loaderIdx, 1)
      return copy
    })
  
    // 5) add the AI’s line and stream tokens as before
    const reader = res.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
        
    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        // Process any remaining content in the buffer
        if (buffer) {
          setLines(prev => [...prev, buffer])
        }
        break
      }

      buffer += decoder.decode(value, { stream: true })
      
      // Process complete lines when we find newline tokens
      while (buffer.includes('|NEWLINE|')) {
        const [line, ...rest] = buffer.split('|NEWLINE|')
        buffer = rest.join('|NEWLINE|')
        
        // Add the completed line
        setLines(prev => [...prev, line])
        
        // Start a new line
        await new Promise(r => setTimeout(r, 30))
      }
      
      // Update the current incomplete line
      if (buffer) {
        setLines(prev => {
          const copy = [...prev]
          if (copy.length === 0 || copy[copy.length - 1].includes('|NEWLINE|')) {
            return [...copy, buffer]
          }
          copy[copy.length - 1] = buffer
          return copy
        })
        await new Promise(r => setTimeout(r, 30))
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
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
          />
        </form>
      )}

      <div ref={terminalEnd} />
    </div>
  )
}
