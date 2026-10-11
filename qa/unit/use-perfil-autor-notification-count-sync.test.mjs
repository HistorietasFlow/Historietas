import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-notification-count-sync.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);

test("Perfil de Autor delega a sincronização do contador de notificações", () => {
  assert.match(pagina, /usePerfilAutorNotificationCountSync/);
  assert.match(
    pagina,
    /usePerfilAutorNotificationCountSync\(\{[\s\S]*?usuarioNotificacoesId,[\s\S]*?usuarioIdLogado,[\s\S]*?setNotificacoesNaoLidasPerfil,[\s\S]*?\}\)/,
  );
  assert.doesNotMatch(
    pagina,
    /async function carregarContadorNotificacoesPerfil\(/,
  );
});

test("hook preserva fallback e consultas do contador", () => {
  assert.match(source, /!idAutorSupabaseValido\(userIdSeguro\)/);
  assert.match(source, /setNotificacoesNaoLidasPerfil\(null\)/);
  assert.match(source, /\.from\("notificacoes"\)/);
  assert.match(source, /\.from\("solicitacoes_seguidores"\)/);
  assert.match(source, /solicitacao-seguidor:/);
  assert.match(source, /setNotificacoesNaoLidasPerfil\(totalSeguro\)/);
});

test("hook preserva realtime, polling, eventos e limpeza", () => {
  assert.match(source, /perfil-autor-contador-notificacoes-/);
  assert.match(source, /"historietas:notificacoes-atualizadas"/);
  assert.match(source, /"focus"/);
  assert.match(source, /"visibilitychange"/);
  assert.match(source, /window\.setInterval\(/);
  assert.match(source, /20000/);
  assert.match(source, /window\.setTimeout\(/);
  assert.match(source, /180/);
  assert.match(source, /cancelado = true;/);
  assert.match(source, /supabase\.removeChannel\(canalContador\)/);
});
