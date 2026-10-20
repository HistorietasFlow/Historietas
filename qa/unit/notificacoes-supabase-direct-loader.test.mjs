import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const loader = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-supabase-direct-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);
const hookInicial = readFileSync(
  new URL(
    "../../app/notificacoes/hooks/use-notificacoes-initial-load.ts",
    import.meta.url,
  ),
  "utf8",
);

test("loader direto preserva leitura, limite e fallbacks", () => {
  assert.match(loader, /export async function carregarNotificacoesDiretasSupabase\(/);
  assert.match(loader, /const userIdLimpo = userId\.trim\(\)/);
  assert.match(loader, /if \(!userIdLimpo\) \{\s*return \[\];/);
  assert.match(
    loader,
    /\.from\("notificacoes"\)\s*\.select\("\*"\)\s*\.eq\("user_id", userIdLimpo\)\s*\.limit\(300\);/,
  );
  assert.match(loader, /if \(error \|\| !Array\.isArray\(data\)\) \{\s*return \[\];/);
  assert.match(loader, /catch \{\s*return \[\];/);
});

test("loader direto preserva bloqueio fechado para conteudo 18+", () => {
  assert.match(loader, /if \(!acessoConteudo18Confirmado\(\)\)/);
  for (const tipo of [
    "novo-capitulo",
    "comentario-obra",
    "curtida-obra",
    "comentario-capitulo",
    "curtida-capitulo",
    "curtida-comentario-capitulo",
  ]) {
    assert.match(loader, new RegExp(`"${tipo}"`));
  }
  assert.match(loader, /extrairSlugObraDeLinkNotificacao\(link\)/);
  assert.match(loader, /\.from\("obras"\)\s*\.select\("id, slug, classificacao_indicativa"\)\s*\.in\("id", obraIds\)\s*\.limit\(obraIds\.length\)/);
  assert.match(loader, /\.from\("obras"\)\s*\.select\("id, slug, classificacao_indicativa"\)\s*\.in\("slug", obraSlugs\)\s*\.limit\(obraSlugs\.length\)/);
  assert.match(loader, /if \(!classificacaoIndicativa\) \{\s*return false;/);
  assert.match(loader, /return !ehClassificacao18\(classificacaoIndicativa\)/);
});

test("loader direto preserva normalizacao, perfis e ordenacao", () => {
  assert.match(loader, /normalizarNotificacaoSupabase\(\s*item as Record<string, unknown>,\s*index\s*\)/);
  assert.match(loader, /await carregarPerfisNotificacoes\(/);
  assert.match(loader, /notificacao\.autorNome \|\| perfil\?\.nome \|\| ""/);
  assert.match(loader, /notificacao\.autorAvatar \|\| perfil\?\.avatar \|\| ""/);
  assert.match(loader, /\.sort\(\(a, b\) => dataNotificacao\(b\) - dataNotificacao\(a\)\)/);
});

test("hook inicial delega o loader direto sem reter a implementacao", () => {
  assert.match(
    hookInicial,
    /from "\.\.\/lib\/notificacoes-supabase-direct-loader";/,
  );
  assert.match(
    hookInicial,
    /carregarEstadoSupabaseNotificacoes\(\s*carregarNotificacoesDiretasSupabase\s*\)/,
  );
  assert.match(pagina, /useNotificacoesInitialLoad\(/);
  assert.doesNotMatch(pagina, /async function carregarNotificacoesDiretasSupabase\(/);
});

test("loader direto nao adiciona estado visual ou persistencia local", () => {
  for (const proibido of ["useEffect", "useState", "localStorage", "window", "document"]) {
    assert.ok(!loader.includes(proibido), `referencia indevida: ${proibido}`);
  }

  assert.doesNotMatch(loader, /return\s*<[^>]/);
});
