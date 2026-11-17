import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { buildSafeSummary, collectDiagnostics } from "../scripts/collect-playwright-diagnostics.mjs";
import { SAFE_FLOW_MARKER } from "../scripts/playwright-safe-flow-schema.mjs";

function reportWith(testCase, resultOverrides = {}) {
  return {
    config: {
      metadata: { password: "fixture-password", person: "Maria Silva" },
      projects: [{ retries: 2, use: { extraHTTPHeaders: { authorization: "Bearer secret-token" } } }],
    },
    suites: [{
      title: "suite Maria Silva maria@example.com",
      specs: [{
        title: "changes account for Maria Silva using password fixture-password",
        file: "C:\\Users\\Maria Silva\\maria@example.com.spec.mjs",
        line: 42,
        column: 3,
        tests: [{
          projectName: "desktop",
          expectedStatus: "passed",
          title: "personal phone +55 11 99999-9999",
          annotations: [{ description: "Rua Privada, 123" }],
          ...testCase,
          results: (testCase.results ?? []).map((result) => ({
            errors: [],
            stdout: ["password=fixture-password"],
            stderr: ["cookie=session-secret; person=maria@example.com"],
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
  assert.equal(summary.schemaVersion, 3);
  assert.equal(summary.tests[0].sourceIndex, 0);
  assert.equal(summary.tests[0].testIndex, 0);
  assert.deepEqual(Object.keys(summary.tests[0]).sort(), [
    "attempts", "classification", "column", "expectedStatus", "line", "project", "sourceIndex", "testIndex",
  ]);
  assert.equal(summary.tests[0].attempts[0].status, "failed");
  assert.equal(summary.tests[0].attempts[0].errorCount, 1);
  assert.deepEqual(summary.tests[0].attempts[0].errorKinds, ["other"]);
  assert.deepEqual(summary.tests[0].attempts[0].attachments, { screenshot: 1, video: 0, trace: 1, other: 0 });
  assert.equal(summary.tests[0].attempts[1].status, "passed");

  const serialized = JSON.stringify(summary);
  for (const secret of [
    "fixture-password", "secret-token", "session-secret", "C:\\secret", "authorization", "cookie",
    "Maria Silva", "maria@example.com", "+55 11 99999-9999", "Rua Privada, 123", "title", "path",
  ]) {
    assert.ok(!serialized.includes(secret), `summary exposed ${secret}`);
  }
});

test("unknown free-form metadata is reduced to closed enums and numeric fields", () => {
  const report = reportWith({
    status: "flaky",
    projectName: "maria@example.com",
    expectedStatus: "Bearer personal-token",
    results: [{ status: "failed", retry: 5511999999999, duration: 5511999999999 }],
  });
  report.suites[0].specs[0].line = 5511999999999;
  report.suites[0].specs[0].column = -123;
  const summary = buildSafeSummary(report);

  assert.equal(summary.tests[0].project, "unknown");
  assert.equal(summary.tests[0].expectedStatus, "unknown");
  assert.equal(summary.tests[0].line, 0);
  assert.equal(summary.tests[0].column, 0);
  assert.equal(summary.tests[0].attempts[0].retry, 0);
  assert.equal(summary.tests[0].attempts[0].durationMs, 0);
  assert.deepEqual(Object.keys(summary.tests[0].attempts[0]).sort(), [
    "attachments", "attempt", "durationMs", "errorCount", "errorKinds", "retry", "safeFlow", "status",
  ]);
  assert.doesNotMatch(JSON.stringify(summary), /maria@example\.com|personal-token/);
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

test("safe flow stdout is re-sanitized before entering summary.json", () => {
  const payload = {
    scenario: "editorial-status",
    token: "Bearer secret-token",
    network: [{ endpoint: "works", method: "GET", requestCount: 1, failedCount: 0, statuses: [{ code: 200, count: 1, body: "Maria Silva" }] }],
    snapshots: [{ phase: "editor-ready", route: "editor", readyState: "complete", authState: "authenticated", rendered: [{ state: "editor-enabled", count: 1, title: "Private title" }], cookie: "session-secret" }],
  };
  const report = reportWith({
    status: "flaky",
    results: [{ status: "failed", stdout: [{ text: `unrelated fixture-password\n${SAFE_FLOW_MARKER}${JSON.stringify(payload)}\n` }] }, { status: "passed", retry: 1 }],
  });
  const summary = buildSafeSummary(report);

  assert.deepEqual(summary.tests[0].attempts[0].safeFlow, [{
    schemaVersion: 1,
    scenario: "editorial-status",
    network: [{ endpoint: "works", method: "GET", requestCount: 1, failedCount: 0, statuses: [{ code: 200, count: 1 }] }],
    snapshots: [{ phase: "editor-ready", route: "editor", readyState: "complete", authState: "authenticated", rendered: [{ state: "editor-enabled", count: 1 }] }],
  }]);
  const serialized = JSON.stringify(summary);
  for (const secret of ["fixture-password", "secret-token", "session-secret", "Maria Silva", "Private title"]) {
    assert.ok(!serialized.includes(secret));
  }
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
    await writeFile(reportPath, JSON.stringify(reportWith({
      status: "flaky",
      results: [{ status: "failed" }, { status: "passed", retry: 1 }],
    })));
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

test("Ajuda conserva apenas as quatro contagens válidas da tentativa que falhou", () => {
  const counts = { forms: 2, visibleForms: 1, titles: 2, visibleTitles: 2 };
  const scenario = "ajuda-support-form";
  const device = "desktop";
  const stdout = [
    { ...counts, text: "fixture-password" }, null,
    { ...counts, visibleForms: 3 }, { ...counts, titles: "2" },
  ].map(sample => SAFE_FLOW_MARKER + JSON.stringify({ scenario, device, counts: sample, html: "fixture-password" }));
  const summary = buildSafeSummary(reportWith({
    status: "flaky",
    results: [{ status: "failed", stdout }, { status: "passed", retry: 1 }],
  }));
  const [failure, retry] = summary.tests[0].attempts;
  assert.deepEqual(failure.safeFlow.map(entry => entry.counts), [counts, null, null, null]);
  assert.deepEqual(failure.safeFlow[0], { schemaVersion: 1, scenario, device, counts });
  assert.deepEqual(retry.safeFlow, []);
  assert.ok(!JSON.stringify(summary).includes("fixture-password"));
});
