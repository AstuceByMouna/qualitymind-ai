import { resolve } from "node:path";
import { defineConfig } from "@playwright/test";

const browsers = ["chromium", "firefox", "webkit"] as const;
const selected = browsers.filter((name) => !process.env.QM_A11Y_BROWSER || process.env.QM_A11Y_BROWSER === name);
if (!selected.length) throw new Error("Unknown audit browser");

export default defineConfig({
  testDir: "./tests/audit",
  workers: 1,
  timeout: 120_000,
  outputDir: "./test-results/qa79",
  reporter: [["list"], ["json", { outputFile: "test-results/qa79-report.json" }]],
  projects: selected.flatMap((browserName) => [390, 820, 1440].map((width) => ({
    name: `${browserName}-${width}`,
    use: {
      browserName,
      viewport: { width, height: 900 },
      launchOptions: { executablePath: process.env[`QM_A11Y_${browserName.toUpperCase()}_BIN`] },
    },
  }))),
  use: { baseURL: "http://127.0.0.1:13032", serviceWorkers: "block" },
  webServer: {
    command: "node node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 13032",
    url: "http://127.0.0.1:13032/failure-analysis", reuseExistingServer: false, timeout: 90000,
    env: {
      API_BASE_URL: "http://127.0.0.1:1",
      NEXT_TELEMETRY_DISABLED: "1",
      QM_NEXT_DIST_DIR: ".next-qa",
      ...(process.env.QM_TEST_FONT_FIXTURE
        ? { NEXT_FONT_GOOGLE_MOCKED_RESPONSES: resolve(process.env.QM_TEST_FONT_FIXTURE) } : {}),
    },
  },
});
