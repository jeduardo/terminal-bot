export default class Client {
  constructor() {
    this.messageHistory = [];
  }

  getCommandResponse = async (prompt, command) => {
    try {
      const res = await fetch("/api/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: command,
          currentPrompt: prompt,
          history: this.messageHistory,
        }),
      });
      const data = await res.json();

      // Add the command and response to the message history
      this.messageHistory.push({ role: "user", content: data.commandPrompt });
      this.messageHistory.push({
        role: "assistant",
        content: data.response.join("\n"),
      });

      return { prompt: data.commandPrompt, lines: data.response };
    } catch (err) {
      return {
        prompt,
        lines: [err.message],
      };
    }
  };

  getBootMessages = async () => {
    try {
      const res = await fetch("/api/boot", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      // Add the boot messages to the message history
      this.messageHistory.push({
        role: "assistant",
        content: data.response.join("\n"),
      });

      return { prompt: data.commandPrompt, lines: data.response };
    } catch (err) {
      console.log(err);
      return {
        prompt: "C:\\> ",
        lines: [err.message],
      };
    }
  };
}
