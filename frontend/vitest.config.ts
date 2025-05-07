import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    coverage: {
      reporter: ["text", "json"],
      reportsDirectory: "coverage",
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
