import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const hookPath = new URL(
  "../../app/editar-capitulo/hooks/useEditarCapituloInitialLoad.ts",
  import.meta.url,
);
const hookSource = readFileSync(hookPath, "utf8");
const pageSource = readFileSync(
  new URL("../../app/editar-capitulo/page.tsx", import.meta.url),
  "utf8",
);

test("useEditarCapituloInitialLoad preserva o lifecycle inicial completo", () => {
  assert.equal(existsSync(hookPath), true);
  assert.match(hookSource, /export function useEditarCapituloInitialLoad/);
  assert.match(hookSource, /window\.location\.search/);
  assert.match(hookSource, /params\.get\("obraId"\) \|\| ""/);
  assert.match(hookSource, /params\.get\("capituloId"\) \|\| ""/);
  assert.match(hookSource, /window\.setTimeout\([\s\S]*?setObraId\(obraIdParam\)[\s\S]*?setCapituloId\(capituloIdParam\)[\s\S]*?, 0\)/);
  assert.match(hookSource, /await supabase\.auth\.getUser\(\)/);
  assert.match(hookSource, /router\.replace\([\s\S]*?criarLoginHrefEditarCapitulo\([\s\S]*?obraIdParam,[\s\S]*?capituloIdParam/);
  assert.match(hookSource, /carregarNomeProfileEditarCapitulo\(userId\)/);
  assert.match(hookSource, /carregarObrasLocaisNormalizadas\(userId\)/);
  assert.match(hookSource, /return !autorId \|\| autorId === userId;/);
  assert.match(hookSource, /aplicarNomeAutorProfileEditarCapitulo\([\s\S]*?userId,[\s\S]*?nomeProfileAutor/);
  assert.match(hookSource, /if \(capituloLocal && !cancelado\) \{[\s\S]*?setTitulo\(capituloLocal\.titulo\);[\s\S]*?setTexto\(capituloLocal\.texto\);/);
  assert.match(hookSource, /\.from\("obras"\)[\s\S]*?\.eq\("id", obraIdParam\)[\s\S]*?\.eq\("user_id", userId\)[\s\S]*?\.limit\(1\)[\s\S]*?\.maybeSingle\(\)/);
  assert.match(hookSource, /Não consegui buscar a obra no Supabase:/);
  assert.match(hookSource, /carregarTodasPaginasSupabase<CapituloSupabaseRow>/);
  assert.match(hookSource, /nomeColecao: "capítulos da edição de capítulo"/);
  assert.match(hookSource, /\.from\("capitulos"\)[\s\S]*?\.order\("ordem", \{ ascending: true \}\)[\s\S]*?\.order\("id", \{ ascending: true \}\)[\s\S]*?\.range\(inicio, fim\)/);
  assert.match(hookSource, /catch \(error\) \{[\s\S]*?Não consegui buscar capítulos no Supabase:[\s\S]*?setObras\(obrasLocais\);[\s\S]*?return;/);
  assert.match(hookSource, /mapearObraSupabase\([\s\S]*?obraSupabase,[\s\S]*?capitulosSupabase,[\s\S]*?obraLocal,[\s\S]*?nomeProfileAutor/);
  assert.match(hookSource, /\[\s*obraNormalizadaSupabase,[\s\S]*?\.\.\.obrasLocais\.filter\(\(obra\) => obra\.id !== obraIdParam\)/);
  assert.match(hookSource, /void supabase[\s\S]*?\.update\([\s\S]*?autor: nomeProfileAutor,[\s\S]*?atualizado_em: new Date\(\)\.toISOString\(\)/);
  assert.match(hookSource, /salvarObrasEditarCapituloStorage\([\s\S]*?obrasAtualizadas,[\s\S]*?userId/);
  assert.match(hookSource, /if \(capituloSupabase && !cancelado\) \{[\s\S]*?setTitulo\(capituloSupabase\.titulo\);[\s\S]*?setTexto\(capituloSupabase\.texto\);/);
  assert.match(hookSource, /catch \{[\s\S]*?setObras\(\[\]\);[\s\S]*?setVerificandoAcesso\(false\);/);
  assert.match(hookSource, /finally \{[\s\S]*?setCarregando\(false\);/);
  assert.match(hookSource, /let cancelado = false;/);
  assert.match(hookSource, /window\.clearTimeout\(atualizarParametrosTimer\)/);
});

test("Editar Capítulo delega somente o lifecycle inicial ao hook", () => {
  assert.match(
    pageSource,
    /import \{ useEditarCapituloInitialLoad \} from "\.\/hooks\/useEditarCapituloInitialLoad";/,
  );
  assert.match(
    pageSource,
    /\} = useEditarCapituloInitialLoad\(\{[\s\S]*?router,[\s\S]*?setTitulo,[\s\S]*?setTexto,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pageSource, /window\.location\.search/);
  assert.doesNotMatch(pageSource, /carregarTodasPaginasSupabase/);
  assert.doesNotMatch(pageSource, /useEffect\(/);
  assert.match(pageSource, /async function importarArquivoTexto/);
  assert.match(
    pageSource,
    /import \{ useEditarCapituloSaveAction \} from "\.\/hooks\/useEditarCapituloSaveAction";/,
  );
  assert.match(pageSource, /const \{ salvarEdicao \} = useEditarCapituloSaveAction\(/);
  assert.doesNotMatch(pageSource, /async function salvarEdicao/);
  assert.match(pageSource, /async function excluirCapitulo/);
  assert.match(pageSource, /<main data-historietas-editar-capitulo-root/);
});
