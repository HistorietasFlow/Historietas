import { defineConfig } from "@playwright/test";
import base from "./playwright.config.mjs";

// Relatórios isolados para preservar evidências de execuções anteriores.
export default defineConfig(base, {
  testMatch: "story-share.spec.mjs",
  workers: 1,
  retries: 0,
  maxFailures: 1,
  outputDir: "./reports/story-stage3/test-results",
  reporter: [["list"], ["json", { outputFile: "reports/story-stage3/playwright-results.json" }]],
});
