import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TEST_OUTCOMES = new Set(["expected", "flaky", "skipped", "unexpected"]);
const RESULT_STATUSES = new Set(["failed", "interrupted", "passed", "skipped", "timedOut"]);

function boundedNumber(value) {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function safeOutcome(value) {
  return TEST_OUTCOMES.has(value) ? value : "unexpected";
}

function safeResultStatus(value) {
  return RESULT_STATUSES.has(value) ? value : "unknown";
}

function safeFileName(value) {
  return typeof value === "string" ? value.replaceAll("\\", "/").split("/").at(-1) : "unknown";
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

function collectSpecs(suite, parents, destination) {
  const title = typeof suite?.title === "string" && suite.title ? suite.title : null;
  const nextParents = title ? [...parents, title] : parents;

  for (const spec of Array.isArray(suite?.specs) ? suite.specs : []) {
    destination.push({ spec, parents: nextParents });
  }
  for (const child of Array.isArray(suite?.suites) ? suite.suites : []) {
    collectSpecs(child, nextParents, destination);
  }
}

function summarizeTest(spec, test, parents, classification) {
  const results = Array.isArray(test?.results) ? test.results : [];
  const attempts = results.map((result, index) => {
    const errors = Array.isArray(result?.errors) ? result.errors : [];
    return {
      attempt: index + 1,
      retry: Number.isInteger(result?.retry) && result.retry >= 0 ? result.retry : index,
      status: safeResultStatus(result?.status),
      durationMs: boundedNumber(result?.duration),
      errorCount: errors.length,
      errorKinds: summarizeErrorKinds(errors, result?.status),
      attachments: summarizeAttachments(result?.attachments),
    };
  });

  return {
    file: safeFileName(spec?.file),
    line: boundedNumber(spec?.line),
    column: boundedNumber(spec?.column),
    title: [...parents, typeof spec?.title === "string" ? spec.title : "unknown"],
    project: typeof test?.projectName === "string" ? test.projectName : "unknown",
    expectedStatus: typeof test?.expectedStatus === "string" ? test.expectedStatus : "passed",
    classification,
    attempts,
  };
}

export function buildSafeSummary(report) {
  const specs = [];
  for (const suite of Array.isArray(report?.suites) ? report.suites : []) collectSpecs(suite, [], specs);

  const totals = { tests: 0, passed: 0, flaky: 0, failed: 0, skipped: 0, attempts: 0 };
  const diagnostics = [];

  for (const { spec, parents } of specs) {
    for (const test of Array.isArray(spec?.tests) ? spec.tests : []) {
      const classification = classifyTest(test);
      totals.tests++;
      totals[classification]++;
      totals.attempts += Array.isArray(test?.results) ? test.results.length : 0;
      if (classification === "flaky" || classification === "failed") {
        diagnostics.push(summarizeTest(spec, test, parents, classification));
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
    schemaVersion: 1,
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
      schemaVersion: 1,
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
