import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests",
  timeout: 30000,
  workers: 1,
  retries: 0,
  use: {
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    trace: "retain-on-failure",
  },
  reporter: "list",
  webServer: {
    command: "node tests/server.mjs",
    url: "http://127.0.0.1:4187/tests/article.html",
    reuseExistingServer: !process.env.CI,
  },
});
