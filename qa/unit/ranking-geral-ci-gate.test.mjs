import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import { load } from "js-yaml";

const workflow = load(readFileSync(new URL("../../.github/workflows/ci.yml", import.meta.url), "utf8"));
const testsJob = workflow.jobs.tests;
const gate = testsJob.steps[0];

test("Tests obrigatorio aguarda equivalencia e nao e pulado quando ela falha", () => {
  assert.equal(testsJob.name, "Tests");
  assert.ok([testsJob.needs].flat().includes("ranking_rls_global"));
  assert.equal(testsJob.if, "${{ always() }}");
  assert.notEqual(testsJob["continue-on-error"], true);
  assert.equal(gate.name, "Exigir equivalencia RLS aprovada");
  assert.equal(gate.if, undefined);
  assert.equal(gate["continue-on-error"], undefined);
  assert.equal(gate.env.RANKING_RLS_RESULT, "${{ needs.ranking_rls_global.result }}");
});

test("gate real aceita apenas success e rejeita falha, cancelamento, skip e ausencia", () => {
  for (const result of ["success", "failure", "cancelled", "skipped", ""]) {
    const execution = spawnSync("bash", ["--noprofile", "--norc", "-e", "-o", "pipefail", "-c", gate.run], {
      encoding: "utf8",
      env: { ...process.env, RANKING_RLS_RESULT: result },
    });
    assert.equal(execution.error, undefined);
    assert.equal(execution.signal, null);
    assert.equal(execution.status, result === "success" ? 0 : 1, `resultado=${result}`);
  }
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
