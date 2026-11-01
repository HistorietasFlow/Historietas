import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const provider = readFileSync(
  new URL("../../components/NotificacoesProvider.tsx", import.meta.url),
  "utf8",
);
const hook = readFileSync(
  new URL(
    "../../components/hooks/use-notificacoes-global-events.ts",
    import.meta.url,
  ),
  "utf8",
);

test("NotificacoesProvider delega os eventos globais sem mover Auth, Realtime ou Context", () => {
  assert.match(
    provider,
    /import \{ useNotificacoesGlobalEvents \} from "\.\/hooks\/use-notificacoes-global-events"/,
  );
  assert.match(provider, /useNotificacoesGlobalEvents\(\{/);
  assert.match(
    provider,
    /usuarioIdRef,\s*receberAvisosRef,\s*agendarAtualizacaoNotificacoes,\s*aplicarReceberAvisos,/,
  );
  assert.match(
    provider,
    /carregarReceberAvisos,\s*criarChaveConfiguracoesUsuario,\s*idUsuarioSupabaseValido,/,
  );
  assert.doesNotMatch(provider, /window\.addEventListener\("storage"/);
  assert.doesNotMatch(provider, /document\.addEventListener\("visibilitychange"/);
  assert.match(provider, /useNotificacoesAuthUserLifecycle\(\{/);
  assert.match(provider, /useNotificacoesRealtimeLifecycle\(\{/);
  assert.match(provider, /supabase\s*\.from\("notificacoes"\)/);
  assert.match(provider, /createContext<NotificacoesContextValue/);
});

test("hook preserva os eventos globais e a sincronizacao da preferencia", () => {
  assert.match(hook, /export function useNotificacoesGlobalEvents/);
  assert.match(hook, /"historietas:notificacoes-atualizadas"/);
  assert.match(hook, /"historietas:configuracoes-atualizadas"/);
  assert.match(hook, /window\.addEventListener\("storage", atualizarAoMudarStorage\)/);
  assert.match(hook, /window\.addEventListener\("focus", atualizarAoRetomarPagina\)/);
  assert.match(
    hook,
    /document\.addEventListener\("visibilitychange", atualizarAoRetomarPagina\)/,
  );
  assert.match(hook, /const userIdSeguro = usuarioIdRef\.current/);
  assert.match(
    hook,
    /receberAvisosRef\.current &&\s*idUsuarioSupabaseValido\(userIdSeguro\)/,
  );
  assert.match(hook, /agendarAtualizacaoNotificacoes\(userIdSeguro\)/);
  assert.match(
    hook,
    /const avisosAtivos = userIdSeguro\s*\? carregarReceberAvisos\(userIdSeguro\)\s*: true;/,
  );
  assert.match(hook, /aplicarReceberAvisos\(avisosAtivos\)/);
  assert.match(
    hook,
    /criarChaveConfiguracoesUsuario\(\s*usuarioIdRef\.current,\s*\)/,
  );
  assert.match(hook, /document\.visibilityState !== "visible"/);
});

test("hook preserva cleanup de todos os listeners e nao incorpora outras responsabilidades", () => {
  assert.match(
    hook,
    /window\.removeEventListener\(\s*"historietas:notificacoes-atualizadas",\s*atualizarAoReceberEventoLocal,/,
  );
  assert.match(
    hook,
    /window\.removeEventListener\(\s*CONFIGURACOES_ATUALIZADAS_EVENT,\s*atualizarPreferenciaDeAvisos,/,
  );
  assert.match(hook, /window\.removeEventListener\("storage", atualizarAoMudarStorage\)/);
  assert.match(hook, /window\.removeEventListener\("focus", atualizarAoRetomarPagina\)/);
  assert.match(
    hook,
    /document\.removeEventListener\(\s*"visibilitychange",\s*atualizarAoRetomarPagina,/,
  );
  assert.doesNotMatch(hook, /supabase/);
  assert.doesNotMatch(hook, /onAuthStateChange/);
  assert.doesNotMatch(hook, /\.channel\(/);
  assert.doesNotMatch(hook, /\.from\(/);
  assert.doesNotMatch(hook, /createContext/);
});
