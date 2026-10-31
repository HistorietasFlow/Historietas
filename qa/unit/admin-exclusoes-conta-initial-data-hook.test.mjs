import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const hookPath = new URL(
  "../../app/admin/exclusoes-conta/hooks/use-admin-exclusoes-conta-initial-data.ts",
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

test("hook concentra os seis estados iniciais e devolve apenas os contratos necessários", () => {
  assert.equal(existsSync(hookPath), true);
  assert.match(hookSource, /export function useAdminExclusoesContaInitialData/);
  assert.match(hookSource, /const \[carregando, setCarregando\] = useState\(true\);/);
  assert.match(hookSource, /const \[acessoNegado, setAcessoNegado\] = useState\(false\);/);
  assert.match(hookSource, /const \[solicitacoes, setSolicitacoes\] = useState<SolicitacaoExclusao\[\]>\(\[\]\);/);
  assert.match(hookSource, /const \[operacoesRecuperaveis, setOperacoesRecuperaveis\] = useState</);
  assert.match(hookSource, /const \[statusRascunho, setStatusRascunho\] = useState</);
  assert.match(hookSource, /const \[observacoes, setObservacoes\] = useState<Record<string, string>>\(\{\}\);/);
  assert.match(hookSource, /carregando,[\s\S]*?acessoNegado,[\s\S]*?setAcessoNegado,[\s\S]*?solicitacoes,[\s\S]*?setSolicitacoes,[\s\S]*?operacoesRecuperaveis,[\s\S]*?statusRascunho,[\s\S]*?setStatusRascunho,[\s\S]*?observacoes,[\s\S]*?setObservacoes,[\s\S]*?carregarSolicitacoes,[\s\S]*?carregarOperacoesRecuperaveis,/);
  assert.doesNotMatch(hookSource, /setCarregando,/);
  assert.doesNotMatch(hookSource, /setOperacoesRecuperaveis,/);
});

test("carregarSolicitacoes preserva callback, HTTP, branches e normalização", () => {
  assert.match(hookSource, /const carregarSolicitacoes = useCallback\(async \(\) => \{/);
  assert.match(hookSource, /setErro\(""\);/);
  assert.match(hookSource, /await buscarSolicitacoesExclusaoAdmin\(\)/);
  assert.match(hookSource, /if \(response\.status === 401\) \{\s*router\.replace\(criarLoginHrefAdminExclusoesConta\(\)\);/);
  assert.match(hookSource, /if \(response\.status === 403\) \{\s*setAcessoNegado\(true\);\s*setSolicitacoes\(\[\]\);/);
  assert.match(hookSource, /if \(!response\.ok \|\| !data\?\.ok\) \{/);
  assert.match(hookSource, /Não foi possível carregar as solicitações de exclusão\./);
  assert.match(hookSource, /\.map\(normalizarSolicitacao\)/);
  assert.match(hookSource, /setAcessoNegado\(false\);\s*setSolicitacoes\(registros\);/);
  assert.match(hookSource, /registros\.reduce<Record<string, StatusSolicitacaoExclusao>>/);
  assert.match(hookSource, /setObservacoes\(\s*registros\.reduce<Record<string, string>>/);
  assertInOrder(
    "setErro(\"\")",
    "await buscarSolicitacoesExclusaoAdmin()",
    "setAcessoNegado(false)",
    "setSolicitacoes(registros)",
  );
});

test("carregarOperacoesRecuperaveis preserva callback, HTTP e normalização", () => {
  assert.match(hookSource, /const carregarOperacoesRecuperaveis = useCallback\(async \(\) => \{/);
  assert.match(hookSource, /await buscarOperacoesRecuperaveisAdmin\(\)/);
  assert.match(hookSource, /setAcessoNegado\(true\);\s*setOperacoesRecuperaveis\(\[\]\);/);
  assert.match(hookSource, /Não foi possível carregar as recuperações pendentes\./);
  assert.match(hookSource, /\.map\(normalizarOperacaoRecuperavel\)/);
  assert.match(hookSource, /filter\(\(item\): item is OperacaoRecuperavel => Boolean\(item\)\)/);
});

test("lifecycle inicial preserva cancelamento, ordem, paralelismo, catch, finally e cleanup", () => {
  assert.match(hookSource, /useEffect\(\(\) => \{\s*let cancelado = false;/);
  assert.match(hookSource, /async function iniciar\(\) \{/);
  assert.match(hookSource, /await Promise\.all\(\[\s*carregarSolicitacoes\(\),\s*carregarOperacoesRecuperaveis\(\),\s*\]\);/);
  assert.match(hookSource, /if \(!cancelado\) \{\s*setErro\(/);
  assert.match(hookSource, /error instanceof Error\s*\? error\.message/);
  assert.match(hookSource, /if \(!cancelado\) \{\s*setCarregando\(false\);/);
  assert.match(hookSource, /void iniciar\(\);/);
  assert.match(hookSource, /return \(\) => \{\s*cancelado = true;/);
  assert.match(
    hookSource,
    /async function iniciar\(\) \{\s*setCarregando\(true\);\s*setErro\(""\);\s*setSucesso\(""\);\s*try \{\s*await Promise\.all\(/,
  );
});

test("página preserva tradução e ações, delegando somente dados iniciais ao hook", () => {
  assert.match(
    pageSource,
    /import \{ useAdminExclusoesContaInitialData \} from "\.\/hooks\/use-admin-exclusoes-conta-initial-data";/,
  );
  assert.match(pageSource, /const t = useCallback\(/);
  assert.match(pageSource, /\[language\],/);
  assert.match(pageSource, /useAdminExclusoesContaInitialData\(\{\s*router,\s*t,\s*setErro,\s*setSucesso,/);
  assert.doesNotMatch(pageSource, /const carregarSolicitacoes = useCallback/);
  assert.doesNotMatch(pageSource, /const carregarOperacoesRecuperaveis = useCallback/);
  assert.match(pageSource, /async function salvarSolicitacao/);
  assert.match(pageSource, /async function recuperarOperacao/);
  assert.match(pageSource, /void Promise\.all\(\[\s*carregarSolicitacoes\(\),\s*carregarOperacoesRecuperaveis\(\),/);
});
