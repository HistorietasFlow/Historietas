import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hookSource = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/hooks/useAdicionarCapituloInitialLoad.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url),
  "utf8",
);

test("useAdicionarCapituloInitialLoad preserva autenticação, termos e rota inicial", () => {
  assert.match(hookSource, /supabase\.auth\.getUser\(\)/);
  assert.match(
    hookSource,
    /router\.replace\(criarLoginHrefAdicionarCapitulo\(obraIdParam\)\);/,
  );
  assert.match(hookSource, /await verificarAceiteTermosPublicacao\(\)/);
  assert.match(hookSource, /router\.replace\(criarHrefAceiteTermos\(redirectTo\)\);/);
  assert.match(
    hookSource,
    /const params = new URLSearchParams\(window\.location\.search\);/,
  );
  assert.match(hookSource, /params\.get\("obraId"\) \|\| ""/);
  assert.match(hookSource, /encodeURIComponent\(obraIdParam\)/);
  assert.match(hookSource, /window\.setTimeout\(/);
  assert.match(hookSource, /window\.clearTimeout\(atualizarObraIdTimer\);/);
});

test("useAdicionarCapituloInitialLoad preserva carregamento, merge e fallback local", () => {
  assert.match(
    hookSource,
    /carregarNomeProfileAdicionarCapitulo\(user\.id\)/,
  );
  assert.match(hookSource, /carregarObrasLocais\(user\.id\)/);
  assert.match(hookSource, /filtrarObrasDoUsuario\(todasObrasLocais, user\.id\)/);
  assert.match(hookSource, /aplicarAutorProfileAdicionarCapitulo\(/);
  assert.match(hookSource, /\.from\("obras"\)/);
  assert.match(hookSource, /\.eq\("user_id", user\.id\)/);
  assert.match(hookSource, /\.order\("criada_em", \{ ascending: false \}\)/);
  assert.match(hookSource, /\.limit\(80\)/);
  assert.match(hookSource, /normalizarObraSupabase\(/);
  assert.match(hookSource, /mesclarObrasComSupabase\(obrasLocais, obrasSupabase\)/);
  assert.match(hookSource, /atualizarObrasLocaisDoUsuario\(/);
  assert.match(hookSource, /salvarObrasAdicionarCapituloStorage\(/);
  assert.match(
    hookSource,
    /Se o Supabase falhar, mantém somente as obras locais do usuário logado\./,
  );
  assert.match(hookSource, /let cancelado = false;/);
  assert.match(hookSource, /cancelado = true;/);
  assert.match(hookSource, /setObras\(obrasFinais\);/);
  assert.match(hookSource, /setCarregando\(false\);/);
});

test("Adicionar Capítulo delega apenas o lifecycle inicial ao hook", () => {
  assert.match(
    pageSource,
    /import \{ useAdicionarCapituloInitialLoad \} from "\.\/hooks\/useAdicionarCapituloInitialLoad";/,
  );
  assert.match(
    pageSource,
    /const \{\s*obraId,\s*usuarioIdLogado,\s*obras,\s*carregando,\s*setObras,\s*\} = useAdicionarCapituloInitialLoad\(\{\s*router,\s*\}\);/,
  );
  assert.doesNotMatch(pageSource, /window\.location\.search/);
  assert.doesNotMatch(
    pageSource,
    /\.select\(\s*"id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,visualizacoes,slug,link,criada_em,atualizado_em,capitulos\(/,
  );
  assert.doesNotMatch(pageSource, /async function criarCapitulo\(/);
  assert.doesNotMatch(pageSource, /function salvarObras\(/);
  assert.match(
    pageSource,
    /import \{ useAdicionarCapituloCreateAction \} from "\.\/hooks\/useAdicionarCapituloCreateAction";/,
  );
});
