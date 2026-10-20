import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const loader = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-supabase-work-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);

test("loader de obras publicadas preserva consulta, capitulos e progresso", () => {
  assert.match(loader, /export async function carregarObrasPublicadasSupabase\(\)/);
  assert.match(loader, /\.from\("obras"\)\s*\.select\(\s*"id,titulo,autor,user_id,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,slug,link,publicado,criada_em"\s*\)\s*\.eq\("publicado", true\)\s*\.order\("criada_em", \{ ascending: false \}\)\s*\.limit\(120\);/);
  assert.match(loader, /\.from\("capitulos"\)\s*\.select\("id,obra_id,titulo,ordem,publicado,criado_em"\)\s*\.in\("obra_id", idsObras\)\s*\.eq\("publicado", true\)\s*\.order\("ordem", \{ ascending: true \}\)\s*\.limit\(1000\);/);
  assert.match(loader, /normalizarObraSupabase\(obra, index\)/);
  assert.match(loader, /normalizarCapituloSupabase\(\s*capitulo,\s*index\s*\)/);
  assert.match(loader, /progressoLeitura: calcularProgressoLeitura\(capitulos\)/);
});

test("loader de obras diretas preserva tentativas, fallback e deduplicacao", () => {
  assert.match(loader, /export async function carregarObrasDasNotificacoesDiretasSupabase\(/);
  assert.match(loader, /if \(obraIds\.length === 0 && capituloIds\.length === 0\) \{\s*return \[\];/);
  assert.match(loader, /const selecoesObras = \[/);
  assert.match(loader, /const selecoesCapitulos = \[/);
  assert.match(loader, /\.in\("id", obraIds\)\s*\.limit\(obraIds\.length\);/);
  assert.match(loader, /\.in\("id", capituloIds\)\s*\.limit\(capituloIds\.length\);/);
  assert.match(loader, /criarObraFallbackNotificacaoDireta\(notificacao\)/);
  assert.match(loader, /extrairTituloCapituloDeMensagemNotificacao\(notificacao\)/);
  assert.match(loader, /!capitulosAtuais\.some\(/);
});

test("pagina delega os loaders de obras sem manter as implementacoes locais", () => {
  assert.match(pagina, /from "\.\/lib\/notificacoes-supabase-work-loader";/);
  assert.match(pagina, /await carregarObrasPublicadasSupabase\(\);/);
  assert.match(pagina, /await carregarObrasDasNotificacoesDiretasSupabase\(\s*notificacoesDiretasSupabase\s*\)/);
  assert.doesNotMatch(pagina, /async function carregarObrasPublicadasSupabase\(/);
  assert.doesNotMatch(pagina, /async function carregarObrasDasNotificacoesDiretasSupabase\(/);
});

test("loader de obras remoto nao adiciona estado visual ou persistencia local", () => {
  for (const proibido of ["useEffect", "useState", "localStorage", "window", "document"]) {
    assert.ok(!loader.includes(proibido), `referencia indevida: ${proibido}`);
  }

  assert.doesNotMatch(loader, /return\s*<[^>]/);
});
