import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 15000,
  retries: 1,
  fullyParallel: true,
  workers: "75%",
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3999",
  },
  projects: [
    // 3 browser engines — viewports tested within each spec
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: "bun run e2e/serve.ts",
    port: 3999,
    reuseExistingServer: true,
    timeout: 10000,
  },
});
