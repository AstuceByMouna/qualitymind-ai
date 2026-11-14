import { defineConfig } from "@playwright/test";
import devConfig from "./playwright.config";

// QA tests run ONLY on the explicitly started isolated services.
// Do not auto-start or accidentally reuse localhost:3000 (DEV).
export default defineConfig({
  ...devConfig,
  use: {
    ...devConfig.use,
    baseURL: "http://127.0.0.1:3001",
  },
  webServer: [],
});
