import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SAFE_FLOW_MARKER, sanitizeSafeFlowDiagnostic } from "./playwright-safe-flow-schema.mjs";

const TEST_OUTCOMES = new Set(["expected", "flaky", "skipped", "unexpected"]);
const RESULT_STATUSES = new Set(["failed", "interrupted", "passed", "skipped", "timedOut"]);
const EXPECTED_STATUSES = new Set(["failed", "passed", "skipped"]);
const PROJECT_NAMES = new Set(["desktop", "mobile"]);

function boundedInteger(value, maximum = 1_000_000) {
  return Number.isSafeInteger(value) && value >= 0 && value <= maximum ? value : 0;
}

function safeOutcome(value) {
  return TEST_OUTCOMES.has(value) ? value : "unexpected";
}

function safeResultStatus(value) {
  return RESULT_STATUSES.has(value) ? value : "unknown";
}

function safeExpectedStatus(value) {
  return EXPECTED_STATUSES.has(value) ? value : "unknown";
}

function safeProjectName(value) {
  if (value === "") return "default";
  return PROJECT_NAMES.has(value) ? value : "unknown";
}

function attachmentKind(attachment) {
  if (attachment?.contentType === "image/png") return "screenshot";
  if (attachment?.contentType === "video/webm") return "video";
  if (attachment?.name === "trace" || attachment?.contentType === "application/zip") return "trace";
  return "other";
}

function summarizeAttachments(attachments = []) {
  const summary = { screenshot: 0, video: 0, trace: 0, other: 0 };
  for (const attachment of attachments) summary[attachmentKind(attachment)]++;
  return summary;
}

function errorKind(error, resultStatus) {
  if (resultStatus === "timedOut") return "timeout";
  const name = typeof error?.name === "string" ? error.name.toLowerCase() : "";
  const message = typeof error?.message === "string" ? error.message.toLowerCase() : "";
  if (name.includes("assert") || message.includes("expect(")) return "assertion";
  if (name.includes("timeout") || message.includes("timeout")) return "timeout";
  if (/econn|enotfound|network|socket|http/.test(name) || /econn|enotfound|network|socket/.test(message)) return "network";
  if (/browser|page|target/.test(name) || /browser|page|target/.test(message)) return "browser";
  return "other";
}

function summarizeErrorKinds(errors = [], resultStatus) {
  return [...new Set(errors.map((error) => errorKind(error, resultStatus)))].sort();
}

function safeFlowDiagnostics(stdout = []) {
  const diagnostics = [];
  for (const chunk of Array.isArray(stdout) ? stdout : []) {
    const text = typeof chunk === "string" ? chunk : typeof chunk?.text === "string" ? chunk.text : "";
    for (const line of text.split(/\r?\n/)) {
      const marker = line.indexOf(SAFE_FLOW_MARKER);
      if (marker < 0) continue;
      try {
        const diagnostic = sanitizeSafeFlowDiagnostic(JSON.parse(line.slice(marker + SAFE_FLOW_MARKER.length)));
        if (diagnostic) diagnostics.push(diagnostic);
      } catch {}
      if (diagnostics.length >= 8) return diagnostics;
    }
  }
  return diagnostics;
}

function resultMatchesExpected(resultStatus, expectedStatus) {
  if (expectedStatus === "failed") return resultStatus === "failed" || resultStatus === "timedOut";
  return resultStatus === expectedStatus;
}

function classifyTest(test) {
  const declared = safeOutcome(test?.status);
  if (declared === "flaky") return "flaky";
  if (declared === "unexpected") return "failed";
  if (declared === "skipped") return "skipped";

  const results = Array.isArray(test?.results) ? test.results : [];
  if (results.length < 1) return declared === "expected" ? "passed" : "failed";

  const expectedStatus = typeof test.expectedStatus === "string" ? test.expectedStatus : "passed";
  const matches = results.map((result) => resultMatchesExpected(result?.status, expectedStatus));
  if (!matches.at(-1)) return "failed";
  return matches.slice(0, -1).some((matchesExpected) => !matchesExpected) ? "flaky" : "passed";
}

function collectSpecs(suite, destination) {
  for (const spec of Array.isArray(suite?.specs) ? suite.specs : []) {
    destination.push(spec);
  }
  for (const child of Array.isArray(suite?.suites) ? suite.suites : []) {
    collectSpecs(child, destination);
  }
}

function summarizeTest(spec, test, classification, sourceIndex, testIndex) {
  const results = Array.isArray(test?.results) ? test.results : [];
  const attempts = results.map((result, index) => {
    const errors = Array.isArray(result?.errors) ? result.errors : [];
    return {
      attempt: index + 1,
      retry: Number.isSafeInteger(result?.retry) && result.retry >= 0 && result.retry <= 10 ? result.retry : index,
      status: safeResultStatus(result?.status),
      durationMs: boundedInteger(result?.duration, 86_400_000),
      errorCount: errors.length,
      errorKinds: summarizeErrorKinds(errors, result?.status),
      attachments: summarizeAttachments(result?.attachments),
      safeFlow: safeFlowDiagnostics(result?.stdout),
    };
  });

  return {
    sourceIndex,
    testIndex,
    line: boundedInteger(spec?.line),
    column: boundedInteger(spec?.column),
    project: safeProjectName(test?.projectName),
    expectedStatus: safeExpectedStatus(test?.expectedStatus),
    classification,
    attempts,
  };
}

export function buildSafeSummary(report) {
  const specs = [];
  for (const suite of Array.isArray(report?.suites) ? report.suites : []) collectSpecs(suite, specs);

  const totals = { tests: 0, passed: 0, flaky: 0, failed: 0, skipped: 0, attempts: 0 };
  const diagnostics = [];

  for (const [sourceIndex, spec] of specs.entries()) {
    const tests = Array.isArray(spec?.tests) ? spec.tests : [];
    for (const [testIndex, test] of tests.entries()) {
      const classification = classifyTest(test);
      totals.tests++;
      totals[classification]++;
      totals.attempts += Array.isArray(test?.results) ? test.results.length : 0;
      if (classification === "flaky" || classification === "failed") {
        diagnostics.push(summarizeTest(spec, test, classification, sourceIndex, testIndex));
      }
    }
  }

  const reportErrorCount = Array.isArray(report?.errors) ? report.errors.length : 0;
  const classification = totals.failed > 0 || reportErrorCount > 0
    ? "failed"
    : totals.flaky > 0
      ? "flaky"
      : "passed";

  return {
    schemaVersion: 3,
    classification,
    shouldUpload: classification === "flaky" || classification === "failed",
    totals,
    reportErrorCount,
    tests: diagnostics,
  };
}

async function writeOutputs(summary) {
  const output = process.env.GITHUB_OUTPUT;
  if (!output) return;
  await appendFile(output, `classification=${summary.classification}\nshould_upload=${summary.shouldUpload}\n`, "utf8");
}

export async function collectDiagnostics(reportPath, outputPath) {
  let summary;
  try {
    const report = JSON.parse(await readFile(reportPath, "utf8"));
    summary = buildSafeSummary(report);
  } catch (error) {
    const unavailableReason = error?.code === "ENOENT" ? "report_missing" : "report_invalid";
    summary = {
      schemaVersion: 3,
      classification: "unavailable",
      shouldUpload: false,
      unavailableReason,
      totals: { tests: 0, passed: 0, flaky: 0, failed: 0, skipped: 0, attempts: 0 },
      reportErrorCount: 0,
      tests: [],
    };
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await writeOutputs(summary);
  console.log(`Playwright diagnostics: ${summary.classification}; upload=${summary.shouldUpload}`);
  return summary;
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const root = path.resolve(path.dirname(scriptPath), "../..");
  const reportPath = path.resolve(process.argv[2] ?? path.join(root, "qa/reports/playwright-results.json"));
  const outputPath = path.resolve(process.argv[3] ?? path.join(root, "qa/reports/playwright-diagnostics/summary.json"));
  await collectDiagnostics(reportPath, outputPath);
}
