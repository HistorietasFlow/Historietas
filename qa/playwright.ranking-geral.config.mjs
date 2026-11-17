import { defineConfig } from "@playwright/test";
import base from "./playwright.config.mjs";

if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(process.env.E2E_BASE_URL ?? "")
  || process.env.NEXT_PUBLIC_RANKING_GERAL_PREVIEW !== "true") {
  throw new Error("Ranking Geral exige app loopback e gate de homologação explicitamente habilitado.");
}
export default defineConfig({
  ...base,
  testDir: "./feature-tests/ranking-geral",
  workers: 1,
  retries: 0,
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
