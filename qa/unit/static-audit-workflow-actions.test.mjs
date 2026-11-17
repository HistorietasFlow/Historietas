import assert from "node:assert/strict";
import test from "node:test";
import { workflowActionsArePinned } from "../scripts/static-audit-workflow-actions.mjs";

const sha = "3d3c42e5aac5ba805825da76410c181273ba90b1";
const pinned = `steps:\n  - uses: actions/checkout@${sha}\n`;
const local = "./.github/workflows/ranking-geral-nucleo-paginado-qa.yml";
const caller = `jobs:\n  equivalencia:\n    uses: ${local}\n`;
const readWorkflow = (files) => (reference) => {
  assert.ok(Object.hasOwn(files, reference), "workflow ausente");
  return files[reference];
};

test("Actions e workflows remotos exigem SHA completo", () => {
  assert.equal(workflowActionsArePinned(pinned), true);
  assert.equal(workflowActionsArePinned(`uses: owner/repo/.github/workflows/qa.yml@${sha}`), true);
  for (const reference of ["actions/checkout@v7", "actions/checkout@main",
    "actions/checkout@3d3c42e", "owner/repo/.github/workflows/qa.yml@main"]) {
    assert.equal(workflowActionsArePinned(`uses: ${reference}`), false);
  }
  assert.equal(workflowActionsArePinned("jobs: {}"), false);
});

test("workflow local do mesmo commit valida as Actions remotas", () => {
  assert.equal(workflowActionsArePinned(caller, readWorkflow({ [local]: pinned })), true);
  assert.equal(workflowActionsArePinned(caller, readWorkflow({
    [local]: "steps:\n  - uses: actions/checkout@v7\n",
  })), false);
});

test("chamadas locais encadeadas nao escondem referencia remota mutavel", () => {
  const nested = "./.github/workflows/nested.yml";
  const files = { [local]: `uses: ${nested}`, [nested]: pinned };
  assert.equal(workflowActionsArePinned(caller, readWorkflow(files)), true);
  files[nested] = "uses: owner/repo/.github/workflows/qa.yml@main";
  assert.equal(workflowActionsArePinned(caller, readWorkflow(files)), false);
});

test("workflow ausente, vazio, ciclico ou fora do diretorio permitido falha fechado", () => {
  assert.equal(workflowActionsArePinned(caller, readWorkflow({})), false);
  assert.equal(workflowActionsArePinned(caller, readWorkflow({ [local]: "" })), false);
  assert.equal(workflowActionsArePinned(caller, readWorkflow({ [local]: caller })), false);
  for (const reference of ["./qa/action.yml", "./.github/workflows/../qa.yml", `${local}@main`]) {
    assert.equal(workflowActionsArePinned(`uses: ${reference}`, () => pinned), false);
  }
});
