import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "coverage/**",
    "node_modules/**",
    "next-env.d.ts",
    "*.zip",

    "playwright-report/**",
    "test-results/**",
    "qa/playwright-report/**",
    "qa/test-results/**",
    "qa/reports/**",

    "eslint-report.json",
    "eslint-report-apos.json",
  ]),

  {
    linterOptions: {
      reportUnusedDisableDirectives: "warn",
    },

    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
]);

export default eslintConfig;