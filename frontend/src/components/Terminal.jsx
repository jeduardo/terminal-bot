import React, { useEffect, useRef, useState } from "react";
import "./terminal.css";

/**
 * Input component for the terminal.
 * Handles user input and displays the prompt.
 *
 * @param {Object} props - The component props.
 * @param {string} props.commandPrompt - The current prompt displayed in the terminal.
 * @param {Function} props.handler - The handler function for processing user input.
 * @returns {JSX.Element} The rendered Input component.
 */
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

  /**
   * Handler function for form submission.
   * Processes the user input and calls the provided handler function.
   *
   * @param {Event} e - The form submission event.
   */
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
      const limit = commandPrompt.length + 1; // for cursor
      input.style.width = `min(${content.length}ch, calc(100% - ${limit}ch))`;
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
        aria-label="Terminal input"
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

/**
 * Screen component for the terminal.
 * Displays the content of the terminal and handles the cursor.
 *
 * @param {Object} props - The component props.
 * @param {string[]} props.content - The lines of content to display in the terminal.
 * @param {boolean} props.processing - Whether the terminal is currently processing input.
 * @param {boolean} props.rendering - Whether the terminal is rendering output.
 * @returns {JSX.Element} The rendered Screen component.
 */
export function Screen({
  content = [""],
  processing = false,
  rendering = false,
}) {
  return (
    <div className="terminal-screen">
      {content.map((line, i) => {
        let cursorClass = [];
        const showCursor = i === content.length - 1;
        if (!showCursor || (showCursor && !processing)) {
          cursorClass.push("terminal-cursor-hidden");
        }
        if (processing && !rendering) {
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

/**
 * Helper function to normalize the prompt ending.
 *
 * @param {string} prompt - The prompt to normalize.
 * @returns {string} The normalized prompt.
 */
function normalizePrompt(prompt) {
  if (!prompt) return "C:\\> ";
  let trimmed = prompt.replace(/[\s>]+$/, "");
  return trimmed + "> ";
}

/**
 * Terminal component that renders the terminal interface.
 * Handles user input, displays content, and manages the boot sequence.
 *
 * @param {Object} props - The component props.
 * @param {string} props.initialPrompt - The initial prompt displayed in the terminal.
 * @param {Function} props.inputHandler - The handler function for processing user input.
 * @param {Function} props.promptNormalizer - The function to normalize the prompt.
 * @param {boolean} props.echoPrompt - Whether to echo the prompt in the terminal.
 * @param {boolean} props.echoCommand - Whether to echo the command in the terminal.
 * @param {Function} props.bootHandler - The handler function for the boot sequence.
 * @returns {JSX.Element} The rendered Terminal component.
 */
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
  const [rendering, setRendering] = useState(false);
  const [commandPrompt, setCommandPrompt] = useState(initialPrompt);
  // Need to use a ref to control boot to avoid double calls
  const booted = useRef(null);
  const terminalEnd = useRef(null);

  // Auto-scroll on new lines
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

  /**
   * Handler function for processing user input.
   * Adds the input to the terminal and calls the provided input handler function.
   *
   * @param {string} commandPrompt - The current prompt displayed in the terminal.
   * @param {string} input - The user input to be processed.
   * @returns {Promise<void>} A promise that resolves when the input is processed.
   */
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

      setRendering(true);
      await displayLines(lines);
      setRendering(false);
      setCommandPrompt(promptNormalizer(prompt));

      setProcessing(false);
      resolve();
    });
  }

  /**
   * Helper function to display lines in the terminal.
   *
   * @param {string[]} lines - The lines to display in the terminal.
   * @returns {Promise<void>} A promise that resolves when the lines are displayed.
   */
  async function displayLines(lines) {
    // Stream each line in the terminal
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      await streamLine(lines[lineIndex], lineIndex);
    }
  }

  /**
   * Helper function to stream a line of text in the terminal.
   *
   * @param {string} line - The line of text to stream.
   * @param {number} lineIndex - The index of the line in the terminal.
   * @param {number} delay - The delay between each character.
   * @returns {Promise<void>} A promise that resolves when the line is streamed.
   */
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
      <Screen content={lines} processing={processing} rendering={rendering} />
      {/* only show the prompt if not processing */}
      {!processing && <Input handler={process} commandPrompt={commandPrompt} />}
      <div ref={terminalEnd} />
    </div>
  );
}
