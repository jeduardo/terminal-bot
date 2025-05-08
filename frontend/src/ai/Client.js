/**
 * Client class for interacting with the backend API to fetch command responses and boot messages.
 */
export default class Client {
  /**
   * Constructor initializes an empty message history array.
   */
  constructor() {
    this.messageHistory = [];
  }

  /**
   * Sends a user command to the backend API and retrieves the response.
   *
   * It uses the structure command + currentPrompt + history defined by the backend.
   *
   * @param {string} prompt - The current prompt or command input from the user.
   * @param {string} command - The command to be executed.
   * @returns {Promise<Object>} - An object containing the command prompt and response lines.
   * @throws {Error} - If the fetch request fails, returns an error message.
   */
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

      // Add the user prompt and system response to the message history
      this.messageHistory.push({ role: "user", content: command });
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

  /**
   * Fetches boot messages from the backend API.
   *
   * @returns {Promise<Object>} - An object containing the command prompt and boot messages.
   * @throws {Error} - If the fetch request fails, returns an error message.
   */
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
      return {
        prompt: "C:\\> ",
        lines: [err.message],
      };
    }
  };
}
