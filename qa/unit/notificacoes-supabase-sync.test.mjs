import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sincronizacao = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-supabase-sync.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);

test("sincronizacao Supabase preserva as mutacoes de leitura e remocao", () => {
  for (const nome of [
    "sincronizarNotificacoesLidasSupabase",
    "sincronizarNotificacaoLidaSupabase",
    "apagarNotificacoesSupabase",
    "apagarNotificacaoSupabase",
    "excluirNotificacoesLidasSupabase",
  ]) {
    assert.match(sincronizacao, new RegExp(`export async function ${nome}`));
  }

  assert.match(sincronizacao, /await supabase\.rpc\("marcar_notificacoes_lidas", \{\s*notificacao_ids: idsNotificacoes,\s*novo_estado: lida,\s*\}\);/);
  assert.match(sincronizacao, /\.update\(\{ lida \}\)\s*\.eq\("user_id", userId\)\s*\.in\("notificacao_id", idsNotificacoes\);/);
  assert.match(sincronizacao, /\.in\("id", idsUuid\);/);
  assert.match(sincronizacao, /\.delete\(\)\s*\.eq\("user_id", userId\)\s*\.in\("notificacao_id", ids\);/);
  assert.match(sincronizacao, /await supabase\.rpc\("excluir_notificacoes_lidas"\);/);
  assert.match(sincronizacao, /const fallbackLimpo = fallbackUserId\.trim\(\);/);
  assert.match(sincronizacao, /fallbackLimpo !== "anon"/);
  assert.match(sincronizacao, /idObraSupabaseValido/);
});

test("pagina delega a sincronizacao sem manter implementacoes locais", () => {
  assert.match(pagina, /from "\.\/lib\/notificacoes-supabase-sync";/);

  for (const nome of [
    "sincronizarNotificacoesLidasSupabase",
    "sincronizarNotificacaoLidaSupabase",
    "apagarNotificacoesSupabase",
    "apagarNotificacaoSupabase",
    "excluirNotificacoesLidasSupabase",
  ]) {
    assert.doesNotMatch(pagina, new RegExp(`async function ${nome}`));
  }
});

test("modulo de sincronizacao nao adiciona estado visual ou persistencia local", () => {
  for (const proibido of ["useEffect", "useState", "localStorage", "window", "document", "<"]) {
    assert.ok(!sincronizacao.includes(proibido), `referencia indevida: ${proibido}`);
  }
});
