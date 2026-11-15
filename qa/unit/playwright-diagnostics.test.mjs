import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { buildSafeSummary, collectDiagnostics } from "../scripts/collect-playwright-diagnostics.mjs";

function reportWith(testCase, resultOverrides = {}) {
  return {
    config: {
      metadata: { password: "fixture-password" },
      projects: [{ retries: 2, use: { extraHTTPHeaders: { authorization: "Bearer secret-token" } } }],
    },
    suites: [{
      title: "suite",
      specs: [{
        title: "changes accounts",
        file: "C:\\runner\\work\\qa\\tests\\lists.spec.mjs",
        line: 42,
        column: 3,
        tests: [{
          projectName: "desktop",
          expectedStatus: "passed",
          ...testCase,
          results: (testCase.results ?? []).map((result) => ({
            errors: [],
            stdout: ["password=fixture-password"],
            stderr: ["cookie=session-secret"],
            attachments: [],
            ...result,
            ...resultOverrides,
          })),
        }],
      }],
    }],
  };
}

test("green run without flaky evidence does not request an upload", () => {
  const summary = buildSafeSummary(reportWith({
    status: "expected",
    results: [{ status: "passed", retry: 0, duration: 120 }],
  }));

  assert.equal(summary.classification, "passed");
  assert.equal(summary.shouldUpload, false);
  assert.deepEqual(summary.totals, { tests: 1, passed: 1, flaky: 0, failed: 0, skipped: 0, attempts: 1 });
  assert.deepEqual(summary.tests, []);
});

test("flaky run requests an upload and keeps only allowlisted attempt metadata", () => {
  const summary = buildSafeSummary(reportWith({
    status: "flaky",
    results: [
      {
        status: "failed",
        retry: 0,
        duration: 45000,
        errors: [{ message: "Bearer secret-token; cookie=session-secret; password=fixture-password" }],
        attachments: [
          { name: "screenshot", contentType: "image/png", path: "C:\\secret\\account.png" },
          { name: "trace", contentType: "application/zip", path: "C:\\secret\\trace.zip" },
        ],
      },
      { status: "passed", retry: 1, duration: 800, attachments: [{ name: "video", contentType: "video/webm" }] },
    ],
  }));

  assert.equal(summary.classification, "flaky");
  assert.equal(summary.shouldUpload, true);
  assert.equal(summary.tests[0].file, "lists.spec.mjs");
  assert.equal(summary.tests[0].attempts[0].status, "failed");
  assert.equal(summary.tests[0].attempts[0].errorCount, 1);
  assert.deepEqual(summary.tests[0].attempts[0].errorKinds, ["other"]);
  assert.deepEqual(summary.tests[0].attempts[0].attachments, { screenshot: 1, video: 0, trace: 1, other: 0 });
  assert.equal(summary.tests[0].attempts[1].status, "passed");

  const serialized = JSON.stringify(summary);
  for (const secret of ["fixture-password", "secret-token", "session-secret", "C:\\secret", "authorization", "cookie"]) {
    assert.ok(!serialized.includes(secret), `summary exposed ${secret}`);
  }
});

test("definitive failure still requests an upload", () => {
  const summary = buildSafeSummary(reportWith({
    status: "unexpected",
    results: [{ status: "timedOut", retry: 2, duration: 45000, errors: [{ message: "timeout" }] }],
  }));

  assert.equal(summary.classification, "failed");
  assert.equal(summary.shouldUpload, true);
  assert.equal(summary.totals.failed, 1);
  assert.equal(summary.tests[0].attempts[0].status, "timedOut");
  assert.deepEqual(summary.tests[0].attempts[0].errorKinds, ["timeout"]);
});

test("an expected failure is not mistaken for a failed run", () => {
  const summary = buildSafeSummary(reportWith({
    status: "expected",
    expectedStatus: "failed",
    results: [{ status: "failed", retry: 0, duration: 20 }],
  }));

  assert.equal(summary.classification, "passed");
  assert.equal(summary.shouldUpload, false);
});

test("collector writes the same outputs consumed by the workflow", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "playwright-diagnostics-"));
  const reportPath = path.join(directory, "report.json");
  const summaryPath = path.join(directory, "diagnostics", "summary.json");
  const githubOutput = path.join(directory, "github-output.txt");
  const previousOutput = process.env.GITHUB_OUTPUT;
  process.env.GITHUB_OUTPUT = githubOutput;

  try {
    await import("node:fs/promises").then(({ writeFile }) => writeFile(reportPath, JSON.stringify(reportWith({
      status: "flaky",
      results: [{ status: "failed" }, { status: "passed", retry: 1 }],
    }))));
    await collectDiagnostics(reportPath, summaryPath);

    const summary = JSON.parse(await readFile(summaryPath, "utf8"));
    const outputs = await readFile(githubOutput, "utf8");
    assert.equal(summary.classification, "flaky");
    assert.match(outputs, /^classification=flaky\nshould_upload=true\n$/);
  } finally {
    if (previousOutput === undefined) delete process.env.GITHUB_OUTPUT;
    else process.env.GITHUB_OUTPUT = previousOutput;
  }
});

test("missing report produces a safe non-throwing diagnostic for failed earlier steps", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "playwright-diagnostics-missing-"));
  const summaryPath = path.join(directory, "diagnostics", "summary.json");
  const summary = await collectDiagnostics(path.join(directory, "missing.json"), summaryPath);

  assert.equal(summary.classification, "unavailable");
  assert.equal(summary.shouldUpload, false);
  assert.equal(summary.unavailableReason, "report_missing");
});
