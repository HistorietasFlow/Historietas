import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const hookPath = new URL(
  "../../app/admin/exclusoes-conta/hooks/use-admin-exclusoes-conta-actions.ts",
  import.meta.url,
);
const hookSource = readFileSync(hookPath, "utf8");
const pageSource = readFileSync(
  new URL("../../app/admin/exclusoes-conta/page.tsx", import.meta.url),
  "utf8",
);

function assertInOrder(...trechos) {
  let indiceAnterior = -1;

  for (const trecho of trechos) {
    const indiceAtual = hookSource.indexOf(trecho);
    assert.notEqual(indiceAtual, -1, `não encontrou: ${trecho}`);
    assert.ok(indiceAtual > indiceAnterior, `ordem incorreta: ${trecho}`);
    indiceAnterior = indiceAtual;
  }
}

test("hook recebe dependências externas e retorna somente as duas ações", () => {
  assert.equal(existsSync(hookPath), true);
  assert.match(hookSource, /export function useAdminExclusoesContaActions/);
  assert.match(hookSource, /Dispatch<SetStateAction<T>>|Dispatch<SetStateAction<string>>/);
  assert.match(hookSource, /SolicitacaoExclusao/);
  assert.match(hookSource, /OperacaoRecuperavel/);
  assert.match(hookSource, /StatusSolicitacaoExclusao/);
  assert.match(hookSource, /TextoTraduzido/);
  assert.match(hookSource, /return \{\s*salvarSolicitacao,\s*recuperarOperacao,\s*\};/);
  assert.doesNotMatch(hookSource, /useState\(/);
  assert.doesNotMatch(hookSource, /useEffect\(/);
  assert.doesNotMatch(hookSource, /useCallback\(/);
});

test("salvarSolicitacao preserva limite, PATCH, respostas e setters locais", () => {
  assert.match(hookSource, /async function salvarSolicitacao\(solicitacao: SolicitacaoExclusao\)/);
  assert.match(hookSource, /const novoStatus = statusRascunho\[solicitacao\.id\] \|\| solicitacao\.status;/);
  assert.match(hookSource, /const observacaoInterna = observacoes\[solicitacao\.id\] \|\| "";/);
  assert.match(hookSource, /if \(observacaoInterna\.length > 4000\)/);
  assert.match(hookSource, /A observação interna pode ter no máximo 4000 caracteres\./);
  assert.match(hookSource, /setAcaoEmAndamento\(solicitacao\.id\);\s*setErro\(""\);\s*setSucesso\(""\);/);
  assert.match(hookSource, /await atualizarSolicitacaoExclusaoAdmin\(\{\s*id: solicitacao\.id,\s*status: novoStatus,\s*observacaoInterna,/);
  assert.match(hookSource, /if \(response\.status === 401\) \{\s*router\.replace\(criarLoginHrefAdminExclusoesConta\(\)\);/);
  assert.match(hookSource, /if \(response\.status === 403\) \{\s*setAcessoNegado\(true\);/);
  assert.match(hookSource, /if \(!response\.ok \|\| !data\?\.ok\) \{/);
  assert.match(hookSource, /normalizarSolicitacao\(data\.solicitacao\)/);
  assert.match(hookSource, /if \(!atualizada\) \{/);
  assert.match(hookSource, /O servidor não retornou a solicitação atualizada\./);
  assert.match(hookSource, /setSolicitacoes\(\(atuais\) =>\s*atuais\.map/);
  assert.match(hookSource, /setStatusRascunho\(\(atuais\) => \(\{/);
  assert.match(hookSource, /setObservacoes\(\(atuais\) => \(\{/);
  assert.match(hookSource, /Solicitação atualizada com segurança\./);
  assert.match(hookSource, /catch \(error\)/);
  assert.match(hookSource, /finally \{\s*setAcaoEmAndamento\(""\);/);
  assertInOrder(
    "if (observacaoInterna.length > 4000)",
    "setAcaoEmAndamento(solicitacao.id)",
    "await atualizarSolicitacaoExclusaoAdmin(",
    "normalizarSolicitacao(data.solicitacao)",
    "setSolicitacoes((atuais)",
    "setStatusRascunho((atuais)",
    "setObservacoes((atuais)",
    "Solicitação atualizada com segurança.",
  );
});

test("recuperarOperacao preserva POST, recarga, mensagens e cleanup", () => {
  assert.match(hookSource, /async function recuperarOperacao\(operacao: OperacaoRecuperavel\)/);
  assert.match(hookSource, /const chaveAcao = `operacao:\$\{operacao\.id\}`;/);
  assert.match(hookSource, /setAcaoEmAndamento\(chaveAcao\);\s*setErro\(""\);\s*setSucesso\(""\);/);
  assert.match(hookSource, /await recuperarOperacaoExclusaoAdmin\(\{\s*id: operacao\.id,/);
  assert.match(hookSource, /if \(response\.status === 401\) \{\s*router\.replace\(criarLoginHrefAdminExclusoesConta\(\)\);/);
  assert.match(hookSource, /if \(response\.status === 403\) \{\s*setAcessoNegado\(true\);/);
  assert.match(hookSource, /await carregarOperacoesRecuperaveis\(\);/);
  assert.match(hookSource, /data\.exclusaoConcluida/);
  assert.match(hookSource, /A recuperação foi concluída e a operação foi finalizada\./);
  assert.match(hookSource, /A recuperação foi executada, mas ainda há acompanhamento pendente\./);
  assert.match(hookSource, /catch \(error\)/);
  assert.match(hookSource, /finally \{\s*setAcaoEmAndamento\(""\);/);
  assertInOrder(
    "const chaveAcao = `operacao:${operacao.id}`",
    "setAcaoEmAndamento(chaveAcao)",
    "await recuperarOperacaoExclusaoAdmin(",
    "await carregarOperacoesRecuperaveis()",
    "data.exclusaoConcluida",
  );
});

test("página delega somente ações e mantém atualização, callbacks e JSX", () => {
  assert.match(
    pageSource,
    /import \{ useAdminExclusoesContaActions \} from "\.\/hooks\/use-admin-exclusoes-conta-actions";/,
  );
  assert.match(pageSource, /useAdminExclusoesContaActions\(\{/);
  assert.doesNotMatch(pageSource, /async function salvarSolicitacao/);
  assert.doesNotMatch(pageSource, /async function recuperarOperacao/);
  assert.match(pageSource, /setAcaoEmAndamento\("recarregar"\);/);
  assert.match(pageSource, /void Promise\.all\(\[\s*carregarSolicitacoes\(\),\s*carregarOperacoesRecuperaveis\(\),/);
  assert.match(pageSource, /onRecuperarOperacao=\{\(operacao\) =>\s*void recuperarOperacao\(operacao\)\}/);
  assert.match(pageSource, /onSalvar=\{\(\) => void salvarSolicitacao\(solicitacao\)\}/);
});
