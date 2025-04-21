import { useState, useRef, useEffect } from 'react'

export default function App() {
  const [lines, setLines] = useState([])
  const [input, setInput] = useState('')
  const [bootComplete, setBootComplete] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [commandPrompt, setCommandPrompt] = useState('C:\\> ')
  const hasBooted = useRef(false)
  const terminalEnd = useRef(null)
  const inputRef = useRef(null)
  const loaderRef = useRef({ idx: null, interval: null }) // Store loader state here

  // Helper to normalize the prompt ending
  function normalizePrompt(prompt) {
    if (!prompt) return 'C:\\> '
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

  // Loader helpers using loaderRef
  function showLoader(setLines) {
    let loaderIdx
    setLines(prev => {
      loaderIdx = prev.length
      return [...prev, '']
    })
    let dotCount = 0
    const loaderInterval = setInterval(() => {
      dotCount = (dotCount + 1) % 4
      setLines(prev => {
        const copy = [...prev]
        copy[loaderIdx] = '.'.repeat(dotCount)
        return copy
      })
    }, 1000)
    loaderRef.current = { idx: loaderIdx, interval: loaderInterval }
  }

  function clearLoader(setLines) {
    const { idx, interval } = loaderRef.current
    if (interval !== null) clearInterval(interval)
    if (idx !== null) {
      setLines(prev => {
        const copy = [...prev]
        copy.splice(idx, 1)
        return copy
      })
    }
    loaderRef.current = { idx: null, interval: null }
  }

  // Modified boot sequence
  useEffect(() => {
    if (hasBooted.current) return
    hasBooted.current = true

    const getBootMessages = async () => {
      const res = await fetch('/api/boot', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        await streamMessage(`Error: Server error (${res.status}) - Please try again later`)
        return
      }

      return res.json();
    }

    const fetchBootMessages = async () => {
      // Show loader
      showLoader(setLines)

      const response = await getBootMessages()
      clearLoader(setLines)

      if (!response) return
      setCommandPrompt(normalizePrompt(response.command_prompt))
      const bootMsgs = response.response

      for (const msg of bootMsgs) {
        await streamMessage(msg)
        await new Promise(r => setTimeout(r, 500))
      }
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
    // Show loader
    showLoader(setLines)
  
    let res
    try {
      res = await fetch('/api/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: command, currentPrompt: commandPrompt }),
      })
    } catch (err) {
      clearLoader(setLines)
      await streamMessage('Error: Connection failed - Please check your network connection')
      return
    }
  
    if (!res.ok) {
      clearLoader(setLines)
      await streamMessage(`Error: Server error (${res.status}) - Please try again later`)
      return
    }
  
    // ...after fetch...
    const data = await res.json()
    const linesArr = data.response || []

    // Clear the loader before streaming output
    clearLoader(setLines)

    // Stream each line in the response array, including empty lines
    for (const line of linesArr) {
      await streamMessage(line)
    }

    // Set the command prompt
    setCommandPrompt(normalizePrompt(data.command_prompt))
  }

  // On Enter: echo → loader/API → show prompt again
  const handleSubmit = async e => {
    e.preventDefault()
    if (!input) return

    setIsStreaming(true)
    setLines(prev => [...prev, (commandPrompt || 'C:\\> ') + input])
    const msg = input
    setInput('')
    await getCommandResponse(msg)
    setIsStreaming(false)
  }

  return (
    <div className="terminal">
      {lines.map((line, i) => (
        <pre key={i} className="terminal-line">{line === '' ? '\u00A0' : line}</pre>
      ))}

      {/* show only after boot AND when not busy */}
      {bootComplete && !isStreaming && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ whiteSpace: 'pre' }}>{commandPrompt}</span>
          <input
            ref={inputRef}
            autoFocus
            value={input}
            autoCapitalize="none"
            onChange={e => setInput(e.target.value)}
            style={{ flex: 1, minWidth: 0 }}
          />
        </form>
      )}

      <div ref={terminalEnd} />
    </div>
  )
}
