import React, { useMemo } from "react";

import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

import Terminal from "./components/Terminal";
import Client from "./ai/Client";

/**
 * The main application component that renders the terminal interface.
 * It initializes the AI client and provides handlers for terminal input and boot messages.
 *
 * @returns {JSX.Element} The rendered App component.
 */
export default function App() {
  /**
   * Memoized instance of the AI client.
   * This ensures that the client is only created once and reused across renders.
   */
  const client = useMemo(() => new Client(), []);

  /**
   * Handler function for processing terminal input.
   * It sends the input to the AI client and returns the response.
   *
   * @param {string} prompt - The current prompt displayed in the terminal.
   * @param {string} input - The user input to be processed.
   * @returns {Promise<{prompt: string, lines: string[]}>} The response from the AI client.
   */
  async function inputHandler(prompt, input) {
    return new Promise(async (resolve) => {
      const { prompt: resPrompt, lines } = await client.getCommandResponse(
        prompt,
        input,
      );
      resolve({ prompt: resPrompt, lines });
    });
  }

  return (
    <div className="crt">
      <Terminal
        inputHandler={inputHandler}
        bootHandler={client.getBootMessages}
      />
      {/* Vercel-specific metric collectors */}
      <Analytics />
      <SpeedInsights />
    </div>
  );
}
