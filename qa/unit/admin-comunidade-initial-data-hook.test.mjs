import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const hookPath = new URL(
  "../../app/admin/comunidade/hooks/use-admin-comunidade-initial-data.ts",
  import.meta.url,
);
const hookSource = readFileSync(hookPath, "utf8");
const pageSource = readFileSync(
  new URL("../../app/admin/comunidade/page.tsx", import.meta.url),
  "utf8",
);

test("o hook concentra os sete estados de dados e expõe somente os setters necessários", () => {
  assert.equal(existsSync(hookPath), true);
  assert.match(hookSource, /export function useAdminComunidadeInitialData/);
  assert.match(hookSource, /const \[carregando, setCarregando\] = useState\(true\);/);
  assert.match(hookSource, /const \[usuarioId, setUsuarioId\] = useState\(""\);/);
  assert.match(hookSource, /const \[ehAdmin, setEhAdmin\] = useState\(false\);/);
  assert.match(hookSource, /const \[denuncias, setDenuncias\] = useState<DenunciaComContexto\[\]>\(\[\]\);/);
  assert.match(hookSource, /const \[denunciasPerfis, setDenunciasPerfis\] = useState</);
  assert.match(hookSource, /const \[reincidenciasPorUsuario, setReincidenciasPorUsuario\] = useState</);
  assert.match(hookSource, /const \[observacoes, setObservacoes\] = useState<Record<string, string>>\(\{\}\);/);
  assert.match(
    hookSource,
    /return \{\s*carregando,\s*usuarioId,\s*ehAdmin,\s*denuncias,\s*setDenuncias,\s*denunciasPerfis,\s*setDenunciasPerfis,\s*reincidenciasPorUsuario,\s*observacoes,\s*setObservacoes,\s*\};/,
  );
});

test("lifecycle valida acesso e protege cada carregador por identidade e geração", () => {
  assert.match(hookSource, /verificarAcessoModeracao\(\)/);
  assert.match(hookSource, /substituirContextoModeracao\(controleModeracao\)/);
  assert.match(hookSource, /ctx\.leitura === leitura/);
  assert.match(hookSource, /onAuthStateChange/);
  assert.match(hookSource, /subscription\.unsubscribe\(\)/);
  assert.match(hookSource, /cancelado = true/);
  for (const name of ["carregarDenunciasComContextoModeracao", "buscarDenunciasPerfisModeracao", "buscarReincidenciasModeracao", "sincronizarObservacoesModeracao"]) assert.match(hookSource, new RegExp(`${name}\\(`));
});

test("a página delega dados iniciais e mantém o lifecycle de fechamento do menu", () => {
  assert.match(
    pageSource,
    /import \{ useAdminComunidadeInitialData \} from "\.\/hooks\/use-admin-comunidade-initial-data";/,
  );
  assert.match(pageSource, /useAdminComunidadeInitialData\(\{[\s\S]*?controleModeracao,[\s\S]*?setErro,[\s\S]*?setSucesso,/);
  assert.doesNotMatch(pageSource, /async function iniciarModeracao/);
  assert.doesNotMatch(pageSource, /async function carregarDenuncias\(/);
  assert.doesNotMatch(pageSource, /async function carregarDenunciasPerfis/);
  assert.doesNotMatch(pageSource, /async function carregarReincidenciasModeracao/);
  assert.match(
    pageSource,
    /useAdminComunidadeModerationFilters\(\{\s*denuncias,\s*denunciasPerfis,\s*setMenuDenunciaAbertoId,\s*\}\)/,
  );
  assert.match(pageSource, /useAdminComunidadeProfileReportActions\(/);
  assert.match(pageSource, /useAdminComunidadeContentReportActions\(/);
});

test("o hook não concentra filtros, ações de moderação ou JSX", () => {
  assert.doesNotMatch(
    hookSource,
    /useMemo|statusFiltro|setStatusFiltro|buscaModeracaoAberta|return\s*\(\s*</,
  );
});
