import { useMemo, useState } from "react";

import Terminal from "./components/Terminal";
import Client from "./ai/Client";

export default function Test() {
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
    <div>
      <Terminal
        inputHandler={inputHandler}
        bootHandler={client.getBootMessages}
      />
    </div>
  );
}
