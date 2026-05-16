import { defineConfig, devices } from "@playwright/test";

const backendUrl = "http://127.0.0.1:5080";
const frontendUrl = "http://127.0.0.1:5173";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: frontendUrl,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm run backend:run",
      url: `${backendUrl}/event-types`,
      cwd: "..",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "npm run frontend:dev",
      url: frontendUrl,
      cwd: "..",
      env: {
        VITE_API_BASE_URL: backendUrl,
      },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
