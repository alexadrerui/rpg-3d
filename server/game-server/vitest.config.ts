import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals:         true,
    environment:     "node",
    fileParallelism: false,
    testTimeout:     15_000,
    env: {
      JWT_SECRET:    "test-secret-at-least-32-characters-long!",
      NODE_ENV:      "test",
      API_URL:       "http://localhost:9999",  // not running — logQueue fails silently
      SERVER_SECRET: "test-server-secret",
    },
  },
})
