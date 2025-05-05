import React, { useMemo } from "react";

import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

import Terminal from "./components/Terminal";
import Client from "./ai/Client";

export default function App() {
  const client = useMemo(() => new Client(), []);

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
