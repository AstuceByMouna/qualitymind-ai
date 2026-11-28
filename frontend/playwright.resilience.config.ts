import { resolve } from "node:path";
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/resilience",
  outputDir: "test-results/qa69",
  retries: 0,
  workers: 1,
  reporter: [
    ["list"], ["junit", { outputFile: "test-results/qa69-junit.xml" }],
    ["html", { outputFolder: "playwright-report/qa69", open: "never" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:13033",
    serviceWorkers: "block",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: { executablePath: process.env.QM_RESILIENCE_CHROMIUM_BIN },
  },
  webServer: {
    command: "node node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 13033",
    url: "http://127.0.0.1:13033/failure-analysis", reuseExistingServer: false, timeout: 90000,
    env: {
      API_BASE_URL: "http://127.0.0.1:1",
      NEXT_TELEMETRY_DISABLED: "1",
      QM_NEXT_DIST_DIR: ".next-qa",
      ...(process.env.QM_TEST_FONT_FIXTURE
        ? { NEXT_FONT_GOOGLE_MOCKED_RESPONSES: resolve(process.env.QM_TEST_FONT_FIXTURE) } : {}),
    },
  },
});
