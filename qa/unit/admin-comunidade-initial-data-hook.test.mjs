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

test("o lifecycle preserva acesso, resets, carregamento concorrente e cleanup", () => {
  assert.match(hookSource, /setCarregando\(true\);\s*setErro\(""\);\s*setSucesso\(""\);/);
  assert.match(
    hookSource,
    /const \{ user, adminConfirmado \} =\s*await verificarAcessoModeracao\(\);/,
  );
  assert.match(hookSource, /if \(!user\) \{/);
  assert.match(
    hookSource,
    /setUsuarioId\(""\);\s*setEhAdmin\(false\);\s*setDenuncias\(\[\]\);\s*setDenunciasPerfis\(\[\]\);\s*setReincidenciasPorUsuario\(\{\}\);\s*router\.replace\(criarLoginHrefAdminModeracao\(\)\);/,
  );
  assert.match(hookSource, /setUsuarioId\(user\.id\);\s*setEhAdmin\(adminConfirmado\);/);
  assert.match(
    hookSource,
    /if \(adminConfirmado\) \{\s*await Promise\.all\(\[\s*carregarDenuncias\(\),\s*carregarDenunciasPerfis\(\),\s*carregarReincidenciasModeracao\(\),\s*\]\);/,
  );
  assert.match(hookSource, /let cancelado = false;/);
  assert.match(
    hookSource,
    /criarMensagemErro\("Erro ao carregar moderação", error\)/,
  );
  assert.match(hookSource, /finally \{\s*if \(!cancelado\) \{\s*setCarregando\(false\);/);
  assert.match(hookSource, /iniciarModeracao\(\);/);
  assert.match(hookSource, /return \(\) => \{\s*cancelado = true;\s*\};/);
  assert.match(hookSource, /\}, \[router\]\);/);
});

test("o hook preserva os três carregadores e a sincronização das observações", () => {
  assert.match(hookSource, /async function carregarDenuncias\(\) \{/);
  assert.match(hookSource, /await carregarDenunciasComContextoModeracao\(\)/);
  assert.match(hookSource, /setDenuncias\(denunciasComContexto\);/);
  assert.match(hookSource, /sincronizarObservacoesModeracao\(\s*observacoesAtuais,\s*denunciasComContexto,/);
  assert.match(hookSource, /async function carregarReincidenciasModeracao\(\)/);
  assert.match(hookSource, /await buscarReincidenciasModeracao\(\)/);
  assert.match(hookSource, /setReincidenciasPorUsuario\(proximoMapa\);/);
  assert.match(hookSource, /async function carregarDenunciasPerfis\(\)/);
  assert.match(hookSource, /await buscarDenunciasPerfisModeracao\(\)/);
  assert.match(hookSource, /setDenunciasPerfis\(denunciasComContexto\);/);
});

test("a página delega dados iniciais e mantém o lifecycle de fechamento do menu", () => {
  assert.match(
    pageSource,
    /import \{ useAdminComunidadeInitialData \} from "\.\/hooks\/use-admin-comunidade-initial-data";/,
  );
  assert.match(pageSource, /useAdminComunidadeInitialData\(\{\s*router,\s*setErro,\s*setSucesso,\s*\}\)/);
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
    /useMemo|statusFiltro|setStatusFiltro|buscaModeracaoAberta|setAcaoEmAndamento|return\s*\(\s*</,
  );
});
