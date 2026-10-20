import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const loader = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-supabase-state-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);

test("loader do estado Supabase preserva obras seguidas e IDs lidos", () => {
  assert.match(loader, /\.from\("seguindo_obras"\)\s*\.select\("obra_id"\)\s*\.eq\("user_id", userId\)\s*\.limit\(1000\);/);
  assert.match(loader, /new Set\(data\.map\(\(\{ obra_id \}\) => obra_id\.trim\(\)\)\.filter\(Boolean\)\)/);
  assert.match(loader, /const userIdLimpo = userId\.trim\(\);/);
  assert.match(loader, /\.from\("notificacoes"\)\s*\.select\("\*"\)\s*\.eq\("user_id", userIdLimpo\)\s*\.eq\("lida", true\)\s*\.limit\(2000\);/);
  assert.match(loader, /pegarTexto\(registro\.notificacao_id\) \|\|\s*pegarTexto\(metadata\.notificacao_id\) \|\|\s*pegarTexto\(registro\.id\)/);
  assert.match(loader, /return \[\];/);
});

test("loader compoe o estado autenticado sem acoplar ao loader de notificacoes diretas", () => {
  assert.match(loader, /export async function carregarEstadoSupabaseNotificacoes\(/);
  assert.match(loader, /const \{ data \} = await supabase\.auth\.getUser\(\);/);
  assert.match(loader, /const userId = data\.user\?\.id \|\| "";/);
  assert.match(loader, /if \(!userId\) \{\s*return null;/);
  assert.match(loader, /await Promise\.all\(\[\s*carregarObrasSeguidasUsuario\(userId\),\s*carregarNotificacoesLidasSupabase\(userId\),\s*carregarNotificacoesDiretasSupabase\(userId\),\s*\]\);/);
  assert.match(loader, /return \{\s*userId,\s*obrasSeguidasIds,\s*notificacoesLidasIds,\s*notificacoesDiretas,\s*\};/);
  assert.doesNotMatch(loader, /from "\.\.\/page"/);
});

test("pagina delega o estado remoto e mantem o loader de notificacoes diretas", () => {
  assert.match(pagina, /from "\.\/lib\/notificacoes-supabase-state-loader";/);
  assert.match(pagina, /carregarEstadoSupabaseNotificacoes\(\s*carregarNotificacoesDiretasSupabase\s*\)/);
  assert.match(pagina, /async function carregarNotificacoesDiretasSupabase\(/);
  assert.doesNotMatch(pagina, /async function carregarObrasSeguidasUsuario\(/);
  assert.doesNotMatch(pagina, /async function carregarNotificacoesLidasSupabase\(/);
  assert.doesNotMatch(pagina, /async function carregarEstadoSupabaseNotificacoes\(/);
});

test("loader do estado remoto nao adiciona estado visual ou persistencia local", () => {
  for (const proibido of ["useEffect", "useState", "localStorage", "window", "document"]) {
    assert.ok(!loader.includes(proibido), `referencia indevida: ${proibido}`);
  }

  assert.doesNotMatch(loader, /return\s*<[^>]/);
});
