import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/notificacoes/hooks/use-notificacoes-initial-load.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);

test("hook preserva autenticacao, carregamento e cancelamento iniciais", () => {
  assert.match(hook, /export function useNotificacoesInitialLoad\(/);
  assert.match(hook, /const router = useRouter\(\);/);
  assert.match(hook, /await supabase\.auth\.getUser\(\)/);
  assert.match(hook, /router\.replace\(criarLoginHrefNotificacoes\(\)\)/);
  assert.match(hook, /let componenteAtivo = true;/);
  assert.match(hook, /return \(\) => \{\s*componenteAtivo = false;/);
  assert.match(hook, /\}, \[router, definirNotificacoesNaoLidas\]\);/);
});

test("hook preserva composicao local, remota, filtros e persistencia", () => {
  assert.match(hook, /const obrasLocais = carregarObras\(usuarioAtualId\);/);
  assert.match(hook, /const notificacoesLocais = carregarNotificacoes\(usuarioAtualId\);/);
  assert.match(hook, /await carregarEstadoSupabaseNotificacoes\(\s*carregarNotificacoesDiretasSupabase\s*\)/);
  assert.match(hook, /new Set\(\[\s*\.\.\.obrasSeguidasLocais,[\s\S]*?estadoSupabase\?\.obrasSeguidasIds/);
  assert.match(hook, /criarNotificacoesDeCapitulos\(/);
  assert.match(hook, /Promise\.all\(\[\s*carregarNotificacoesComunidadeSupabase\(/);
  assert.match(hook, /carregarNotificacoesDiarioSupabase\(/);
  assert.match(hook, /carregarNotificacoesProblemasTecnicosSupabase\(/);
  assert.match(hook, /salvarJsonStorageUsuarioNotificacoes\(/);
  assert.match(hook, /salvarNotificacoes\(notificacoesMescladas, usuarioAtualId\);/);
});

test("hook preserva estados finais e fallback autenticado", () => {
  assert.match(hook, /setUsuarioNotificacoesId\(usuarioAtualId\);/);
  assert.match(hook, /setObras\(obrasMescladas\);/);
  assert.match(hook, /setNotificacoes\(notificacoesMescladas\);/);
  assert.match(hook, /setObras\(obrasLocais\);/);
  assert.match(hook, /setNotificacoes\(notificacoesLocais\);/);
  assert.match(hook, /if \(componenteAtivo && !manterCarregando\) \{\s*setCarregando\(false\);/);
});

test("pagina delega somente o lifecycle inicial ao hook", () => {
  assert.match(pagina, /from "\.\/hooks\/use-notificacoes-initial-load";/);
  assert.match(pagina, /useNotificacoesInitialLoad\(\{[\s\S]*?setUsuarioNotificacoesId,[\s\S]*?\}\);/);
  assert.doesNotMatch(pagina, /async function carregarDados\(\)/);
  assert.doesNotMatch(pagina, /supabase\.auth\.getUser\(\)/);
});

test("hook nao adiciona JSX ou mutacoes Supabase", () => {
  assert.doesNotMatch(hook, /return\s*<[^>]/);
  assert.doesNotMatch(hook, /\.(insert|update|delete|upsert)\(/);
});
