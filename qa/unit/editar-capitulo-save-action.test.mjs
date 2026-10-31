import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const hookPath = new URL(
  "../../app/editar-capitulo/hooks/useEditarCapituloSaveAction.ts",
  import.meta.url,
);
const hookSource = readFileSync(hookPath, "utf8");
const pageSource = readFileSync(
  new URL("../../app/editar-capitulo/page.tsx", import.meta.url),
  "utf8",
);

function indice(texto) {
  const resultado = hookSource.indexOf(texto);

  assert.notEqual(resultado, -1, `não encontrei ${texto}`);
  return resultado;
}

test("useEditarCapituloSaveAction preserva a ação de salvar edição", () => {
  assert.equal(existsSync(hookPath), true);
  assert.match(hookSource, /export function useEditarCapituloSaveAction/);
  assert.match(hookSource, /async function salvarEdicao\(event: FormEvent<HTMLFormElement>\)/);
  assert.match(hookSource, /event\.preventDefault\(\)/);
  assert.match(
    hookSource,
    /if \(processando \|\| excluindo \|\| !obraAtual \|\| !capituloAtual\) \{\s*return;/,
  );
  assert.match(hookSource, /const erroValidacao = validarCapitulo\([\s\S]*?titulo,[\s\S]*?texto,[\s\S]*?numeroCapitulo,/);
  assert.match(hookSource, /const tituloFinal = titulo\.trim\(\) \|\| `Capítulo \$\{numeroCapitulo \|\| 1\}`/);
  assert.match(hookSource, /const textoFinal = texto\.trim\(\)/);
  assert.match(hookSource, /await supabase\.auth\.getUser\(\)/);
  assert.match(hookSource, /router\.replace\(criarLoginHrefEditarCapitulo\(obraId, capituloId\)\)/);
  assert.match(hookSource, /autorIdObra && autorIdObra !== userId/);
  assert.match(hookSource, /carregarNomeProfileEditarCapitulo\(userId\)/);
  assert.match(hookSource, /idObraSupabaseValido\(obraId\) && idObraSupabaseValido\(capituloId\)/);
  assert.match(hookSource, /\.from\("obras"\)[\s\S]*?\.select\("id"\)[\s\S]*?\.eq\("id", obraId\)[\s\S]*?\.eq\("user_id", userId\)[\s\S]*?\.limit\(1\)[\s\S]*?\.maybeSingle\(\)/);
  assert.match(hookSource, /\.from\("capitulos"\)[\s\S]*?\.update\(\{[\s\S]*?titulo: tituloFinal,[\s\S]*?texto: textoFinal,[\s\S]*?atualizado_em: atualizadoEm,[\s\S]*?\}\)[\s\S]*?\.eq\("id", capituloId\)[\s\S]*?\.eq\("obra_id", obraId\)[\s\S]*?\.eq\("user_id", userId\)[\s\S]*?\.select\("id, ordem"\)[\s\S]*?\.maybeSingle\(\)/);
  assert.match(hookSource, /Number\.isInteger\(capituloAtualizado\.ordem\)/);
  assert.match(hookSource, /aplicarEdicaoCapituloNasObrasLocais\(/);
  assert.match(hookSource, /carregarBackupArquivosObras\(userId\)/);
  assert.match(hookSource, /restaurarArquivoObraComBackup\([\s\S]*?normalizarObra\(obra, index\),[\s\S]*?backupArquivos/);
  assert.match(hookSource, /salvarObrasEditarCapituloStorage\([\s\S]*?novasObrasComBackup,[\s\S]*?userId/);
  assert.match(hookSource, /setObras\(novasObrasDoUsuario\)/);
  assert.match(hookSource, /await registrarDiarioEdicaoCapitulo\(/);
  assert.match(hookSource, /await atualizarNotificacaoCapituloSupabase\(/);
  assert.match(hookSource, /setSalvou\(true\)/);
  assert.match(hookSource, /window\.scrollTo\(\{[\s\S]*?behavior: "smooth"/);
  assert.match(hookSource, /finally \{\s*setProcessando\(false\);/);
});

test("useEditarCapituloSaveAction preserva a ordem sensível do salvamento", () => {
  assert.ok(indice("const erroValidacao = validarCapitulo") < indice("setProcessando(true)"));
  assert.ok(indice("await supabase.auth.getUser()") < indice('.from("obras")'));
  assert.ok(indice('.from("capitulos")') < hookSource.lastIndexOf("aplicarEdicaoCapituloNasObrasLocais"));
  assert.ok(hookSource.lastIndexOf("salvarObrasEditarCapituloStorage") < indice("setObras(novasObrasDoUsuario)"));
  assert.ok(indice("setObras(novasObrasDoUsuario)") < indice("await registrarDiarioEdicaoCapitulo"));
  assert.ok(indice("await registrarDiarioEdicaoCapitulo") < indice("await atualizarNotificacaoCapituloSupabase"));
  assert.ok(indice("await atualizarNotificacaoCapituloSupabase") < indice("setSalvou(true)"));
});

test("Editar Capítulo mantém estado, JSX e exclusão na página", () => {
  assert.match(
    pageSource,
    /import \{ useEditarCapituloSaveAction \} from "\.\/hooks\/useEditarCapituloSaveAction";/,
  );
  assert.match(pageSource, /const \{ salvarEdicao \} = useEditarCapituloSaveAction\(/);
  assert.match(pageSource, /<form onSubmit=\{salvarEdicao\}/);
  assert.doesNotMatch(pageSource, /async function salvarEdicao/);
  assert.match(pageSource, /async function importarArquivoTexto/);
  assert.match(pageSource, /async function excluirCapitulo/);
  assert.match(pageSource, /const \[salvou, setSalvou\] = useState\(false\)/);
  assert.match(pageSource, /const \[processando, setProcessando\] = useState\(false\)/);
  assert.match(pageSource, /const \[excluindo, setExcluindo\] = useState\(false\)/);
});
