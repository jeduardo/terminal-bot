import { useEffect, useRef, useState } from "react";
import "./terminal.css";

export function Input({ commandPrompt = "C:\\> ", handler }) {
  const [prompt, _] = useState(commandPrompt);
  const [content, setContent] = useState("");
  const [isProcessingHandler, setIsProcessingHandler] = useState(false);
  const inputRef = useRef(null);

  // Focus on the input whenever we click or focus the window
  useEffect(() => {
    const handleFocus = () => {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("click", handleFocus);

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("click", handleFocus);
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (content.trim() === "") return;

    if (handler) {
      setIsProcessingHandler(true);
      setContent("");
      try {
        await handler(commandPrompt, content);
      } finally {
        setIsProcessingHandler(false);
      }
    }

    // Return focus after processing
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  // Adjust the size of the input according to text length
  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      input.style.width = `${content.length}ch`;
    }
  }, [content]);

  return (
    <form
      id="terminal-input-form"
      className="terminal-input-container"
      onSubmit={handleSubmit}
    >
      <span className="terminal-input-prompt">{prompt}</span>
      <input
        id="terminal-input-content"
        ref={inputRef}
        className="terminal-input-content"
        autoFocus
        value={content}
        autoCapitalize="none"
        autoCorrect="false"
        spellCheck="false"
        autoComplete="off"
        disabled={isProcessingHandler}
        onChange={(e) => setContent(e.target.value)}
      />
      <span
        className={`terminal-cursor ${
          !isProcessingHandler
            ? " terminal-cursor-blink"
            : "terminal-cursor-hidden"
        }`}
      >
        {"\u2588"}
      </span>
    </form>
  );
}

export function Screen({ content = [""], processing = false }) {
  return (
    <div className="terminal-screen">
      {content.map((line, i) => {
        let cursorClass = [];
        const showCursor = i === content.length - 1;
        if (!showCursor || (showCursor && !processing)) {
          cursorClass.push("terminal-cursor-hidden");
        }
        if (processing) {
          cursorClass.push("terminal-cursor-blink");
        }

        return (
          <div key={i} className="terminal-line">
            <span>{line}</span>
            <span className={`${cursorClass.join(" ")}`}>{"\u2588"}</span>
          </div>
        );
      })}
    </div>
  );
}

// Helper to normalize the prompt ending
function normalizePrompt(prompt) {
  if (!prompt) return "C:\\> ";
  let trimmed = prompt.replace(/[\s>]+$/, "");
  return trimmed + "> ";
}

export default function Terminal({
  initialPrompt = "C:\\> ",
  inputHandler,
  promptNormalizer = normalizePrompt,
  echoPrompt = true,
  echoCommand = true,
  bootHandler = async () => {
    return { prompt: initialPrompt, lines: [] };
  },
}) {
  const [lines, setLines] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [commandPrompt, setCommandPrompt] = useState(initialPrompt);
  // Need to use a ref to control boot to avoid double calls
  const booted = useRef(null);
  const terminalEnd = useRef(null);

  // Auto‑scroll on new lines
  useEffect(() => {
    terminalEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  // Boot sequence
  useEffect(() => {
    if (booted.current) return;
    // Need to set the boot ASAP to avoid double calls
    booted.current = true;

    // Add an empty line and set processing so the cursor blinks
    setLines([""]);
    setProcessing(true);

    const init = async () => {
      try {
        const { prompt, lines } = await bootHandler();
        setCommandPrompt(promptNormalizer(prompt));
        // Don't forget to await until the lines are displayed.
        await displayLines(lines);
      } catch (err) {
        console.error("boot sequence failed:", err);
      } finally {
        setProcessing(false);
      }
    };

    init();
  }, []);

  async function process(commandPrompt, input) {
    return new Promise(async (resolve) => {
      // Add the prompt line and a new line for processing immediately
      const echo = [];
      if (echoPrompt) echo.push(commandPrompt);
      if (echoCommand) echo.push(input);
      setLines((prevLines) => [...prevLines, echo.join(""), ""]);
      // Run a remote command
      setProcessing(true);

      // Run the handler and get the next prompt and display lines
      const res = await inputHandler(commandPrompt, input);
      const { prompt, lines } = res;

      await displayLines(lines);
      setCommandPrompt(promptNormalizer(prompt));

      setProcessing(false);
      resolve();
    });
  }

  async function displayLines(lines) {
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      await streamLine(lines[lineIndex], lineIndex);
    }
  }

  async function streamLine(line, lineIndex, delay = 30) {
    let currentLine = "";
    // Add an empty line to force a blinking cursor and prepare
    // space for the new line.
    setLines((prevLines) => [...prevLines, currentLine]);

    // Remove the blinking cursor if it's the first line
    if (lineIndex === 0) {
      setLines((prevLines) => {
        const newLines = [...prevLines];
        newLines.pop(); // Remove the blinking cursor
        return newLines;
      });
    }

    // Stream the other characters one by one
    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      await new Promise((resolve) => setTimeout(resolve, delay)); // Delay for each character
      currentLine += line[charIndex];
      setLines((prevLines) => {
        const newLines = [...prevLines];
        newLines[newLines.length - 1] = currentLine;
        return newLines;
      });
    }
  }

  return (
    <div className="terminal">
      <Screen content={lines} processing={processing} />
      {/* only show the prompt if not processing */}
      {!processing && <Input handler={process} commandPrompt={commandPrompt} />}
      <div ref={terminalEnd} />
    </div>
  );
}
