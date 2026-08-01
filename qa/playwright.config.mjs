import "./env.mjs";
import { defineConfig } from "@playwright/test";

const baseURL = (process.env.E2E_BASE_URL || "https://www.historietas.com.br").replace(/\/$/, "");
const localBase = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(baseURL);

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  timeout: 45_000,
  expect: { timeout: 12_000 },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : 3,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "reports/playwright-results.json" }]
  ],
  use: {
    baseURL,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    viewport: { width: 1440, height: 900 },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  webServer: localBase
    ? {
        command: "npm --prefix .. run dev",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000
      }
    : undefined
});
