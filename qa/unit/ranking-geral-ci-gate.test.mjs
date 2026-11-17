import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import { load } from "js-yaml";

const workflow = load(readFileSync(new URL("../../.github/workflows/ci.yml", import.meta.url), "utf8"));
const testsJob = workflow.jobs.tests;
const gate = testsJob.steps[0];

test("Tests obrigatorio aguarda RLS e interface e nao e pulado quando um deles falha", () => {
  assert.equal(testsJob.name, "Tests");
  assert.deepEqual([...testsJob.needs].sort(), ["ranking_interface_integrada", "ranking_rls_global"]);
  assert.equal(testsJob.if, "${{ always() }}");
  assert.notEqual(testsJob["continue-on-error"], true);
  assert.equal(gate.name, "Exigir equivalencia RLS e interface aprovadas");
  assert.equal(gate.if, undefined);
  assert.equal(gate["continue-on-error"], undefined);
  assert.equal(gate.env.RANKING_RLS_RESULT, "${{ needs.ranking_rls_global.result }}");
  assert.equal(gate.env.RANKING_INTERFACE_RESULT, "${{ needs.ranking_interface_integrada.result }}");
});

test("gate real exige sucesso dos dois jobs e rejeita falha, cancelamento, skip e ausencia", () => {
  for (const rls of ["success", "failure", "cancelled", "skipped", ""]) {
    for (const ui of ["success", "failure", "cancelled", "skipped", ""]) {
      const execution = spawnSync("bash", ["--noprofile", "--norc", "-e", "-o", "pipefail", "-c", gate.run], {
        encoding: "utf8",
        env: { ...process.env, RANKING_RLS_RESULT: rls, RANKING_INTERFACE_RESULT: ui },
      });
      assert.equal(execution.error, undefined);
      assert.equal(execution.signal, null);
      assert.equal(execution.status, rls === "success" && ui === "success" ? 0 : 1, `RLS=${rls} UI=${ui}`);
    }
  }
});

test("interface usa somente checkout integrado e preview local, com Playwright sem retry", () => {
  assert.equal(workflow.env.NEXT_PUBLIC_RANKING_GERAL_PREVIEW, undefined);
  assert.equal(testsJob.env.NEXT_PUBLIC_RANKING_GERAL_PREVIEW, undefined);
  for (const key of ["SENTRY_AUTH_TOKEN", "NEXT_PUBLIC_SENTRY_DSN", "SENTRY_DSN"]) {
    assert.equal(workflow.env[key], "");
  }
  const dependency = workflow.jobs.ranking_interface_integrada;
  assert.equal(dependency.if, undefined);
  assert.equal(dependency["continue-on-error"], undefined);
  const reusable = load(readFileSync(new URL(`../../${dependency.uses}`, import.meta.url), "utf8"));
  assert.ok(Object.hasOwn(reusable.on, "workflow_call"));
  const job = reusable.jobs["interface-real"];
  assert.equal(job.if, undefined);
  assert.equal(job["continue-on-error"], undefined);
  assert.equal(job.env.NEXT_PUBLIC_RANKING_GERAL_PREVIEW, "true");
  assert.equal(job.env.E2E_BASE_URL, "http://127.0.0.1:3000");
  for (const key of ["SENTRY_AUTH_TOKEN", "NEXT_PUBLIC_SENTRY_DSN", "SENTRY_DSN"]) {
    assert.equal(job.env[key], "");
  }
  const checkouts = job.steps.filter((item) => item.uses?.startsWith("actions/checkout@"));
  assert.equal(checkouts.length, 1);
  assert.equal(checkouts[0].with.ref, undefined);
  const e2e = job.steps.find((item) => item.run === "node qa/scripts/run-playwright-local.mjs --config=playwright.ranking-geral.config.mjs --workers=1 --retries=0");
  assert.ok(e2e);
  assert.equal(e2e.if, undefined);
  assert.equal(e2e["continue-on-error"], undefined);
});

test("equivalencia continua executando pgTAP, Data API e comparacao global sem opcionalidade", () => {
  const dependency = workflow.jobs.ranking_rls_global;
  assert.equal(dependency.if, undefined);
  assert.equal(dependency["continue-on-error"], undefined);
  assert.equal(dependency.uses, "./.github/workflows/ranking-geral-nucleo-paginado-qa.yml");
  const reusable = load(readFileSync(new URL(`../../${dependency.uses}`, import.meta.url), "utf8"));
  const job = reusable.jobs["db-and-privacy"];
  assert.equal(job.if, undefined);
  assert.equal(job["continue-on-error"], undefined);
  for (const command of ["supabase test db",
    "node --test --test-concurrency=1 qa/integration/ranking-geral-supabase-real.test.mjs",
    "node qa/benchmarks/ranking-geral-nucleo-migrado.test.mjs"]) {
    const step = job.steps.find((item) => item.run === command);
    assert.ok(step, command);
    assert.equal(step.if, undefined);
    assert.equal(step["continue-on-error"], undefined);
  }
});
