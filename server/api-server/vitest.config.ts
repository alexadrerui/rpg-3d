import { defineConfig } from "vitest/config"

const TEST_DB = "postgresql://rpg3d:rpg3d@localhost:5432/rpg3d_test"

export default defineConfig({
  test: {
    globals:          true,
    environment:      "node",
    setupFiles:       ["./src/test/setup.ts"],
    globalSetup:      ["./src/test/global-setup.ts"],
    fileParallelism:  false,
    testTimeout:      20000,
    env: {
      DATABASE_URL:           TEST_DB,
      JWT_SECRET:             "test-secret-at-least-32-characters-long!",
      JWT_REFRESH_SECRET:     "test-refresh-secret-minimum-32-chars!!",
      JWT_EXPIRES_IN:         "15m",
      JWT_REFRESH_EXPIRES_IN: "7d",
      SERVER_SECRET:          "test-server-secret",
      NODE_ENV:               "test",
    },
  },
})
