import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const actionPath = new URL(
  "../../app/editar-capitulo/hooks/useEditarCapituloDeleteAction.ts",
  import.meta.url,
);
const actionSource = readFileSync(actionPath, "utf8");
const pageSource = readFileSync(
  new URL("../../app/editar-capitulo/page.tsx", import.meta.url),
  "utf8",
);

test("useEditarCapituloDeleteAction preserva a exclusão autorizada e sua ordem", () => {
  assert.equal(existsSync(actionPath), true);
  assert.match(actionSource, /export function useEditarCapituloDeleteAction/);
  assert.match(
    actionSource,
    /if \(processando \|\| excluindo \|\| !obraAtual \|\| !capituloAtual\) \{/,
  );
  assert.match(actionSource, /window\.confirm\(/);
  assert.match(actionSource, /criarMensagemConfirmacaoExclusaoCapitulo\([\s\S]*?capituloAtual\.titulo,[\s\S]*?language/);
  assert.match(actionSource, /await supabase\.auth\.getUser\(\)/);
  assert.match(actionSource, /router\.replace\(criarLoginHrefEditarCapitulo\(obraId, capituloId\)\)/);
  assert.match(actionSource, /idObraSupabaseValido\(obraId\) && idObraSupabaseValido\(capituloId\)/);
  assert.match(actionSource, /\.from\("obras"\)[\s\S]*?\.select\("id"\)[\s\S]*?\.eq\("id", obraId\)[\s\S]*?\.eq\("user_id", userId\)[\s\S]*?\.limit\(1\)[\s\S]*?\.maybeSingle\(\)/);
  assert.match(actionSource, /\.from\("capitulos"\)[\s\S]*?\.delete\(\)[\s\S]*?\.eq\("id", capituloId\)[\s\S]*?\.eq\("obra_id", obraId\)[\s\S]*?\.eq\("user_id", userId\)[\s\S]*?\.select\("id"\)[\s\S]*?\.maybeSingle\(\)/);
  assert.match(actionSource, /removerCapituloDasObrasLocais\(\{/);
  assert.match(actionSource, /salvarObrasEditarCapituloStorage\([\s\S]*?novasObras,[\s\S]*?userId/);
  assert.match(actionSource, /setObras\(novasObrasDoUsuario\)/);
  assert.match(actionSource, /router\.replace\("\/painel-autor"\)/);
  assert.match(actionSource, /router\.refresh\(\)/);
  assert.match(actionSource, /setErro\(mensagem\)/);
  assert.match(actionSource, /setTipoErro\("excluir"\)/);
  assert.match(actionSource, /window\.scrollTo\(/);
  assert.match(actionSource, /finally \{[\s\S]*?setExcluindo\(false\)/);

  const indiceConfirmacao = actionSource.indexOf("window.confirm");
  const indiceInicioExclusao = actionSource.indexOf("setExcluindo(true)");
  const indiceAutenticacao = actionSource.indexOf("await supabase.auth.getUser()");
  const indiceAutorizacao = actionSource.indexOf('.from("obras")');
  const indiceExclusaoRemota = actionSource.indexOf('.from("capitulos")');
  const indiceMutacaoLocal = actionSource.indexOf(
    "removerCapituloDasObrasLocais",
    indiceExclusaoRemota,
  );
  const indicePersistencia = actionSource.indexOf(
    "salvarObrasEditarCapituloStorage(",
    indiceMutacaoLocal,
  );
  const indiceSetObras = actionSource.indexOf("setObras(novasObrasDoUsuario)");
  const indiceReplace = actionSource.indexOf('router.replace("/painel-autor")');
  const indiceRefresh = actionSource.indexOf("router.refresh()");

  assert.ok(indiceConfirmacao < indiceInicioExclusao);
  assert.ok(indiceAutenticacao < indiceAutorizacao);
  assert.ok(indiceAutorizacao < indiceExclusaoRemota);
  assert.ok(indiceExclusaoRemota < indiceMutacaoLocal);
  assert.ok(indiceMutacaoLocal < indicePersistencia);
  assert.ok(indicePersistencia < indiceSetObras);
  assert.ok(indiceSetObras < indiceReplace);
  assert.ok(indiceReplace < indiceRefresh);
});

test("Editar Capítulo delega somente a ação de excluir capítulo", () => {
  assert.match(
    pageSource,
    /import \{ useEditarCapituloDeleteAction \} from "\.\/hooks\/useEditarCapituloDeleteAction";/,
  );
  assert.match(pageSource, /const \{ excluirCapitulo \} = useEditarCapituloDeleteAction\(/);
  assert.doesNotMatch(pageSource, /async function excluirCapitulo/);
  assert.match(pageSource, /function marcarAlteracao\(\)/);
  assert.match(pageSource, /async function importarArquivoTexto/);
  assert.match(pageSource, /const \{ salvarEdicao \} = useEditarCapituloSaveAction\(/);
  assert.match(pageSource, /onClick=\{\(\) => \{[\s\S]*?void excluirCapitulo\(\);[\s\S]*?\}\}/);
  assert.match(pageSource, /<form onSubmit=\{salvarEdicao\}/);
});

test("a action não compõe JSX nem controla estado próprio", () => {
  assert.doesNotMatch(actionSource, /useState|useEffect|useCallback/);
  assert.doesNotMatch(actionSource, /return\s*\(\s*</);
  assert.doesNotMatch(actionSource, /localStorage|sessionStorage/);
});
