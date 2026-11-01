import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const provider = readFileSync(
  new URL("../../components/NotificacoesProvider.tsx", import.meta.url),
  "utf8",
);
const hook = readFileSync(
  new URL(
    "../../components/hooks/use-notificacoes-auth-user-lifecycle.ts",
    import.meta.url,
  ),
  "utf8",
);

test("NotificacoesProvider delega somente o lifecycle de autenticação ao hook", () => {
  assert.match(
    provider,
    /import \{ useNotificacoesAuthUserLifecycle \} from "\.\/hooks\/use-notificacoes-auth-user-lifecycle"/,
  );
  assert.match(provider, /useNotificacoesAuthUserLifecycle\(\{/);
  assert.match(
    provider,
    /\bmontadoRef,\s*usuarioIdRef,\s*receberAvisosRef,\s*requisicaoAtualRef,/,
  );
  assert.match(provider, /\blimparAtualizacaoAgendada,\s*limparCanal,/);
  assert.match(provider, /\bcarregarReceberAvisos,\s*idUsuarioSupabaseValido,\s*erroEhSessaoAusente,/);
  assert.doesNotMatch(provider, /supabase\.auth\.getUser\(\)/);
  assert.doesNotMatch(provider, /supabase\.auth\.onAuthStateChange\(/);
  assert.match(
    provider,
    /import \{ useNotificacoesRealtimeLifecycle \} from "\.\/hooks\/use-notificacoes-realtime-lifecycle"/,
  );
  assert.match(provider, /window\.addEventListener\("storage"/);
});

test("hook preserva carregamento do usuário e preferência na troca de conta", () => {
  assert.match(hook, /export function useNotificacoesAuthUserLifecycle/);
  assert.match(hook, /supabase\.auth\.getUser\(\)/);
  assert.match(hook, /montadoRef\.current = true/);
  assert.match(hook, /if \(!montadoRef\.current\) \{\s*return;/);
  assert.match(hook, /const avisosAtivos = carregarReceberAvisosNoEfeito\(userId\)/);
  assert.match(hook, /usuarioIdRef\.current = userId;/);
  assert.match(hook, /receberAvisosRef\.current = avisosAtivos;/);
  assert.match(hook, /setUsuarioId\(userId\)/);
  assert.match(hook, /setReceberAvisos\(avisosAtivos\)/);
  assert.match(hook, /await atualizarNotificacoesPorUsuario\(userId, true\)/);
  assert.match(hook, /setNotificacoesNaoLidas\(0\)/);
  assert.match(hook, /setCarregandoNotificacoes\(false\)/);
});

test("hook preserva debounce, invalidação e cleanup da autenticação", () => {
  assert.match(hook, /const authTimerRef = useRef<number \| null>\(null\)/);
  assert.match(hook, /supabase\.auth\.onAuthStateChange\(\(_event, session\) => \{/);
  assert.match(hook, /limparAtualizacaoAuth\(\);\s*authTimerRef\.current = window\.setTimeout/);
  assert.match(hook, /requisicaoAtualRef\.current \+= 1;/);
  assert.match(hook, /limparAtualizacaoAgendada\(\);\s*limparCanal\(\);/);
  assert.match(
    hook,
    /carregarReceberAvisosNoEfeito\(userIdSeguro\)/,
  );
  assert.match(hook, /montadoRef\.current = false;/);
  assert.match(hook, /window\.clearTimeout\(authTimerRef\.current\)/);
  assert.match(hook, /subscription\.unsubscribe\(\)/);
  assert.match(hook, /limparCanal\(\);/);
});

test("hook não incorpora Realtime, eventos globais ou Context", () => {
  assert.doesNotMatch(hook, /\.channel\(/);
  assert.doesNotMatch(hook, /removeChannel/);
  assert.doesNotMatch(hook, /addEventListener\("storage"/);
  assert.doesNotMatch(hook, /visibilitychange/);
  assert.doesNotMatch(hook, /createContext/);
  assert.doesNotMatch(hook, /NotificacoesContext/);
});
