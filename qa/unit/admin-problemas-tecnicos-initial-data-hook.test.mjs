import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/admin/problemas-tecnicos/page.tsx", "utf8");
const hook = readFileSync(
  "app/admin/problemas-tecnicos/hooks/use-admin-problemas-tecnicos-initial-data.ts",
  "utf8",
);

test("hook preserva o carregamento e o mapa de nomes dos problemas técnicos", () => {
  assert.match(hook, /const carregarNomes = useCallback/);
  assert.match(hook, /new Set\(userIds\.map\(\(id\) => id\.trim\(\)\)\.filter\(Boolean\)\)/);
  assert.match(hook, /if \(ids\.length === 0\) \{\s*setNomesUsuarios\(\{\}\);\s*return;/);
  assert.match(hook, /buscarPerfisProblemasTecnicosAdmin\(ids\)/);
  assert.match(hook, /porUserId\.error/);
  assert.match(hook, /porId\.error/);
  assert.match(hook, /perfil\.nome\?\.trim\(\)/);
  assert.match(hook, /perfil\.username\.trim\(\)\.replace\(\/\^@\+\//);
  assert.match(hook, /pt: "Usuário"/);
  assert.match(hook, /mapa\[perfil\.user_id\.trim\(\)\] = nome/);
  assert.match(hook, /mapa\[perfil\.id\.trim\(\)\] = nome/);
  assert.match(hook, /setNomesUsuarios\(mapa\)/);
  assert.match(hook, /const carregarProblemas = useCallback/);
  assert.match(hook, /setErro\(""\)/);
  assert.match(hook, /buscarProblemasTecnicosAdmin\(\)/);
  assert.match(hook, /if \(error\) \{\s*throw error;/);
  [
    "registro.id",
    "registro.user_id",
    "registro.email_contato",
    "registro.categoria",
    "registro.titulo",
    "registro.descricao",
    "registro.pagina_url",
    "registro.navegador",
    "registro.dispositivo",
    "registro.status",
    "registro.prioridade",
    "registro.observacao_admin",
    "registro.analisado_por",
    "registro.analisado_em",
    "registro.criado_em",
    "registro.atualizado_em",
  ].forEach((campo) => assert.ok(hook.includes(campo), campo));
  assert.match(hook, /setProblemas\(registros\)/);
  assert.match(hook, /setObservacoes\(/);
  assert.match(hook, /await carregarNomes\(registros\.map\(\(problema\) => problema\.userId\)\)/);
});

test("hook preserva lifecycle administrativo, cancelamento e contrato da página", () => {
  assert.match(hook, /let cancelado = false/);
  assert.match(hook, /setCarregando\(true\)/);
  assert.match(hook, /setErro\(""\)/);
  assert.match(hook, /setSucesso\(""\)/);
  assert.match(hook, /supabase\.auth\.getUser\(\)/);
  assert.match(hook, /if \(usuarioErro\) \{\s*throw usuarioErro;/);
  assert.match(hook, /if \(!usuario\) \{/);
  assert.match(hook, /setUsuarioId\(""\)/);
  assert.match(hook, /setEhAdmin\(false\)/);
  assert.match(hook, /router\.replace\(criarLoginHrefAdminProblemasTecnicos\(\)\)/);
  assert.match(hook, /verificarAdministradorProblemasTecnicos\(\)/);
  assert.match(hook, /if \(cancelado\) return/);
  assert.match(hook, /setUsuarioId\(usuario\.id\)/);
  assert.match(hook, /setEhAdmin\(adminConfirmado\)/);
  assert.match(hook, /if \(adminConfirmado\) \{\s*await carregarProblemas\(\);/);
  assert.match(hook, /criarMensagemErro\("Erro ao carregar problemas técnicos", error\)/);
  assert.match(hook, /setCarregando\(false\)/);
  assert.match(hook, /void iniciar\(\)/);
  assert.match(hook, /return \(\) => \{\s*cancelado = true;/);
  assert.match(page, /import \{ useAdminProblemasTecnicosInitialData \} from "\.\/hooks\/use-admin-problemas-tecnicos-initial-data";/);
  assert.match(page, /useAdminProblemasTecnicosInitialData\(\{/);
  assert.doesNotMatch(page, /const carregarNomes = useCallback/);
  assert.doesNotMatch(page, /const carregarProblemas = useCallback/);
  assert.doesNotMatch(page, /useEffect\(\(\) => \{/);
  assert.match(page, /useAdminProblemasTecnicosActions/);
  assert.match(page, /recarregarProblemasTecnicos\(carregarProblemas\)/);
});
