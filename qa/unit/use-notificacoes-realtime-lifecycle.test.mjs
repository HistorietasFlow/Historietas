import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const provider = readFileSync(
  new URL("../../components/NotificacoesProvider.tsx", import.meta.url),
  "utf8",
);
const hook = readFileSync(
  new URL(
    "../../components/hooks/use-notificacoes-realtime-lifecycle.ts",
    import.meta.url,
  ),
  "utf8",
);

test("NotificacoesProvider delega somente o lifecycle de Realtime ao hook", () => {
  assert.match(
    provider,
    /import \{ useNotificacoesRealtimeLifecycle \} from "\.\/hooks\/use-notificacoes-realtime-lifecycle"/,
  );
  assert.match(provider, /useNotificacoesRealtimeLifecycle\(\{/);
  assert.match(
    provider,
    /const \{\s*limparAtualizacaoAgendada,\s*limparCanal,\s*agendarAtualizacaoNotificacoes,\s*\} = useNotificacoesRealtimeLifecycle/,
  );
  assert.doesNotMatch(provider, /supabase\s*\.channel\(/);
  assert.doesNotMatch(provider, /supabase\.removeChannel\(/);
  assert.match(provider, /window\.addEventListener\("storage"/);
  assert.match(provider, /window\.addEventListener\("focus"/);
  assert.match(provider, /document\.addEventListener\("visibilitychange"/);
  assert.match(
    provider,
    /window\.addEventListener\(\s*"historietas:notificacoes-atualizadas"/,
  );
  assert.match(provider, /createContext<NotificacoesContextValue/);
});

test("hook preserva canal, atualização inicial e mudanças Postgres do usuário atual", () => {
  assert.match(hook, /export function useNotificacoesRealtimeLifecycle/);
  assert.match(hook, /const canalRef = useRef<RealtimeChannel \| null>\(null\)/);
  assert.match(hook, /supabase\s*\.channel\(`notificacoes-provider-\$\{userIdSeguro\}`\)/);
  assert.match(hook, /"postgres_changes"/);
  assert.match(hook, /schema: "public"/);
  assert.match(hook, /table: "notificacoes"/);
  assert.match(hook, /filter: `user_id=eq\.\$\{userIdSeguro\}`/);
  assert.match(hook, /agendarAtualizacaoNotificacoes\(userIdSeguro\)/);
  assert.match(hook, /const atualizacaoInicialTimer = window\.setTimeout/);
  assert.match(hook, /atualizarNotificacoesPorUsuario\(userIdSeguro\)/);
  assert.match(hook, /\.subscribe\(\)/);
});

test("hook preserva debounce, reset e cleanup contra canal obsoleto", () => {
  assert.match(hook, /const atualizarTimerRef = useRef<number \| null>\(null\)/);
  assert.match(hook, /!receberAvisosRef\.current/);
  assert.match(hook, /usuarioIdRef\.current !== userIdSeguro/);
  assert.match(hook, /window\.setTimeout\(\(\) => \{[\s\S]*?\}, 250\)/);
  assert.match(hook, /if \(!receberAvisos \|\| !idUsuarioSupabaseValido\(userIdSeguro\)\)/);
  assert.match(hook, /setNotificacoesNaoLidas\(0\)/);
  assert.match(hook, /setCarregandoNotificacoes\(false\)/);
  assert.match(hook, /if \(canalRef\.current === canal\)/);
  assert.match(hook, /window\.clearTimeout\(atualizacaoInicialTimer\)/);
  assert.match(hook, /window\.clearTimeout\(atualizarTimerRef\.current\)/);
  assert.match(hook, /supabase\.removeChannel\(canal\)/);
});

test("hook não incorpora Auth, eventos globais ou Context", () => {
  assert.doesNotMatch(hook, /supabase\.auth/);
  assert.doesNotMatch(hook, /addEventListener\("storage"/);
  assert.doesNotMatch(hook, /addEventListener\("focus"/);
  assert.doesNotMatch(hook, /visibilitychange/);
  assert.doesNotMatch(hook, /historietas:notificacoes-atualizadas/);
  assert.doesNotMatch(hook, /createContext/);
  assert.doesNotMatch(hook, /NotificacoesContext/);
});
