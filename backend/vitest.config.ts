import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    reporters: ["junit", "default"],
    outputFile: "./reports/test-report.junit.xml",
    coverage: {
      provider: "istanbul",
      reporter: ["text", "json"],
      reportsDirectory: "reports",
      all: true,
      include: ["src/**/*.js"],
      exclude: ["src/**/*.test.js", "**/node_modules/**"],
    },
  },
});
