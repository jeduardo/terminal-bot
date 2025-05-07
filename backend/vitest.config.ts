import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "istanbul",
      reporter: ["text", "json"],
      reportsDirectory: "coverage",
      all: true,
      include: ["src/**/*.js"],
      exclude: ["src/**/*.test.js", "**/node_modules/**"],
    },
  },
});
