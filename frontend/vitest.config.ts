import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    reporters: ["junit", "default"],
    outputFile: "./reports/test-report.junit.xml",
    coverage: {
      reporter: ["text", "json"],
      reportsDirectory: "reports",
      exclude: [
        "vite*",
        ".*.js",
        "build/**",
        "node_modules/**",
        "src/index.jsx",
      ],
    },
  },
});
