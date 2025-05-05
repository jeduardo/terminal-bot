import { useState, useRef, useEffect } from "react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

import Terminal from "./components/Terminal";

export default function App() {
  const [lines, setLines] = useState([]);
  const [input, setInput] = useState("");
  const [messageHistory, setMessageHistory] = useState([]);
  const [bootComplete, setBootComplete] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);
  const [commandPrompt, setCommandPrompt] = useState("C:\\> ");
  const hasBooted = useRef(false);
  const terminalEnd = useRef(null);
  const inputRef = useRef(null);
  const formRef = useRef(null);

  // Helper to normalize the prompt ending
  function normalizePrompt(prompt) {
    if (!prompt) return "C:\\> ";
    let trimmed = prompt.replace(/[\s>]+$/, "");
    return trimmed + "> ";
  }

  // Auto‑scroll on new lines
  useEffect(() => {
    terminalEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  // Modified boot sequence
  useEffect(() => {
    if (hasBooted.current) return;
    hasBooted.current = true;

    const getBootMessages = async () => {
      setIsProcessing(true);
      const res = await fetch("/api/boot", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        await streamMessage(
          `Error: Server error (${res.status}) - Please try again later`,
        );
        return;
      }

      setIsProcessing(false);
      return res.json();
    };

    const fetchBootMessages = async () => {
      // Add an empty line to show the blinking cursor
      setLines([""]);

      const response = await getBootMessages();
      setLines([]); // Clear the blinking cursor

      if (!response) return;

      // add response content to history, joining array into newlines.
      setMessageHistory((prev) => [
        ...prev,
        { role: "assistant", content: response.response.join("\n") },
      ]);

      setCommandPrompt(normalizePrompt(response.commandPrompt));
      const bootMsgs = response.response;

      // Add a blank line to separate boot messages from the command prompt
      if (
        bootMsgs &&
        bootMsgs.length > 0 &&
        bootMsgs[bootMsgs.length - 1] !== ""
      ) {
        bootMsgs.push("");
      }

      setIsStreaming(true);
      for (const msg of bootMsgs) {
        await streamMessage(msg);
        await new Promise((r) => setTimeout(r, 500));
      }
      setIsStreaming(false);
      setBootComplete(true);
    };

    fetchBootMessages();
  }, []);

  // Add focus handler effect
  useEffect(() => {
    const handleFocus = () => {
      inputRef.current?.focus();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("click", handleFocus);

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("click", handleFocus);
    };
  }, []);

  // Modified AI response handling
  async function getCommandResponse(commandPrompt, command) {
    let res;
    try {
      res = await fetch("/api/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: command,
          currentPrompt: commandPrompt,
          history: messageHistory,
        }),
      });
    } catch (err) {
      await streamMessage(
        "Error: Connection failed - Please check your network connection",
      );
      return;
    } finally {
      setLines((prev) => prev.slice(0, -1)); // Remove blinking cursor
      setIsProcessing(false);
    }

    if (!res.ok) {
      await streamMessage(
        `Error: Server error (${res.status}) - Please try again later`,
      );
      return;
    }

    // ...after fetch...
    const data = await res.json();
    const linesArr = data.response || [];

    // Add the command to the message history
    setMessageHistory((prev) => [...prev, { role: "user", content: command }]);
    // Then do the same for the response
    setMessageHistory((prev) => [
      ...prev,
      { role: "assistant", content: linesArr.join("\n") },
    ]);

    setIsStreaming(true);
    for (const line of linesArr) {
      await streamMessage(line);
    }
    setIsStreaming(false);

    // Set the command prompt
    setCommandPrompt(normalizePrompt(data.commandPrompt));

    // Focus the input after command completes
    inputRef.current?.focus();
  }

  return (
    <div className="crt">
      <Terminal
        commandPrompt={commandPrompt}
        inputHandler={getCommandResponse}
      />
      {/* Vercel-specific metric collectors */}
      <Analytics />
      <SpeedInsights />
    </div>
  );
}
