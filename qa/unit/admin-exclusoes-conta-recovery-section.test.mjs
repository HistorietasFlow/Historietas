import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync("app/admin/exclusoes-conta/page.tsx", "utf8");
const componentSource = readFileSync(
  "app/admin/exclusoes-conta/components/admin-exclusoes-conta-recovery-section.tsx",
  "utf8",
);

test("seção de recuperação preserva a apresentação e os callbacks", () => {
  assert.match(componentSource, /OperacaoRecuperavel/);
  assert.match(componentSource, /operacoesRecuperaveis\.length/);
  assert.match(componentSource, /operacoesRecuperaveis\.map/);
  assert.match(componentSource, /const recuperando = acaoEmAndamento === `operacao:\$\{operacao\.id\}`/);
  assert.match(componentSource, /const bloqueadoPorLock = operacao\.lockAtivo && !recuperando/);
  assert.match(componentSource, /Boolean\(acaoEmAndamento && !recuperando\)/);
  assert.match(componentSource, /"excluindo_auth"/);
  ["Auth interrompido", "Falha pós-Auth", "Retomando...", "Em processamento", "Retomar recuperação"].forEach(
    (texto) => assert.ok(componentSource.includes(texto), texto),
  );
  assert.match(componentSource, /formatarData\(operacao\.atualizadaEm\)/);
  assert.match(componentSource, /tentativasStorage/);
  assert.match(componentSource, /tentativasAuth/);
  assert.match(componentSource, /operacao\.lockExpiraEm &&/);
  assert.match(componentSource, /bucketsPendentes\.join\(", "\)/);
  assert.match(componentSource, /ultimoErroMensagem/);
  assert.doesNotMatch(componentSource, /fetch\(|useState|useEffect|supabase|router|localStorage/);
});

test("página delega somente a seção visual de recuperação", () => {
  assert.match(pageSource, /AdminExclusoesContaRecoverySection/);
  assert.match(pageSource, /onRecuperarOperacao=\{\(operacao\) => void recuperarOperacao\(operacao\)\}/);
  assert.match(pageSource, /async function recuperarOperacao\(operacao: OperacaoRecuperavel\)/);
  assert.doesNotMatch(pageSource, /<section style=\{recoverySectionStyle\}>/);
});
