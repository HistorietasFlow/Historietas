import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const source = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/hooks/useAdicionarCapituloCreateAction.ts",
    import.meta.url,
  ),
  "utf8",
);

function antes(primeiro, segundo) {
  const inicioCriarCapitulo = source.indexOf("async function criarCapitulo");

  assert.ok(
    source.indexOf(primeiro, inicioCriarCapitulo) <
      source.indexOf(segundo, inicioCriarCapitulo),
    `esperava ${primeiro} antes de ${segundo}`,
  );
}

test("Adicionar Capítulo delega a criação ao hook e mantém o formulário", () => {
  assert.match(
    pageSource,
    /import \{ useAdicionarCapituloCreateAction \} from "\.\/hooks\/useAdicionarCapituloCreateAction";/,
  );
  assert.match(
    pageSource,
    /const \{ criarCapitulo \} = useAdicionarCapituloCreateAction\(\{[\s\S]*?salvarObras,[\s\S]*?setArquivoImportadoErro,[\s\S]*?\}\);/,
  );
  assert.match(pageSource, /<form[\s\S]*?onSubmit=\{criarCapitulo\}/);
  assert.doesNotMatch(pageSource, /async function criarCapitulo\(/);
  assert.doesNotMatch(pageSource, /function salvarObras\(/);
  assert.doesNotMatch(pageSource, /function limparFeedback\(/);
  assert.doesNotMatch(pageSource, /async function importarArquivoTexto\(/);
  assert.match(pageSource, /const \[titulo, setTitulo\] = useState\(""\);/);
  assert.match(pageSource, /const \[texto, setTexto\] = useState\(""\);/);
  assert.match(pageSource, /const \[processando, setProcessando\] = useState\(false\);/);
  assert.match(source, /export function useAdicionarCapituloCreateAction\(/);
  assert.match(source, /async function criarCapitulo\(event: FormEvent<HTMLFormElement>\)/);
  assert.match(source, /return \{ criarCapitulo \};/);
});

test("a action preserva validação, lock, autenticação e autoria", () => {
  assert.match(source, /event\.preventDefault\(\);/);
  assert.match(
    source,
    /if \(!obraAtual \|\| processando \|\| criandoCapituloRef\.current\) \{/,
  );
  assert.match(
    source,
    /validarCapitulo\(\s*titulo,\s*texto,\s*numeroNovoCapitulo,\s*\);/,
  );
  assert.match(source, /criandoCapituloRef\.current = true;/);
  assert.match(source, /setProcessando\(true\);/);
  assert.match(source, /await supabase\.auth\.getUser\(\)/);
  assert.match(
    source,
    /router\.replace\(criarLoginHrefAdicionarCapitulo\(obraAtual\.id \|\| obraId\)\);/,
  );
  assert.match(source, /obraAtual\.autorId && obraAtual\.autorId !== user\.id/);
  assert.match(
    source,
    /\.from\("obras"\)[\s\S]*?\.select\("id"\)[\s\S]*?\.eq\("id", obraAtual\.id\)[\s\S]*?\.eq\("user_id", user\.id\)[\s\S]*?\.maybeSingle\(\)/,
  );
  antes("event.preventDefault()", "const erroValidacao");
  antes("const erroValidacao", "criandoCapituloRef.current = true");
  antes("criandoCapituloRef.current = true", "await supabase.auth.getUser()");
});

test("a action preserva ordem, insert, atualização local e efeitos não bloqueantes", () => {
  assert.match(
    source,
    /\.from\("capitulos"\)[\s\S]*?\.select\("ordem"\)[\s\S]*?\.eq\("obra_id", obraAtual\.id\)[\s\S]*?\.order\("ordem", \{ ascending: false \}\)[\s\S]*?\.limit\(1\)[\s\S]*?\.maybeSingle\(\)/,
  );
  assert.match(source, /ordemNovoCapitulo = Math\.max\(/);
  assert.match(
    source,
    /\.from\("capitulos"\)[\s\S]*?\.insert\(\{[\s\S]*?obra_id: obraAtual\.id,[\s\S]*?user_id: user\.id,[\s\S]*?publicado: true,[\s\S]*?\}\)[\s\S]*?\.select\("id, criado_em, ordem"\)[\s\S]*?\.single\(\)/,
  );
  assert.match(source, /criarNotificacaoNovoCapitulo\(/);
  assert.match(source, /aplicarNovoCapituloNasObrasLocais\(\{/);
  assert.match(source, /salvarObras\(novasObras\);/);
  assert.match(source, /void registrarDiarioNovoCapitulo\(\{/);
  assert.match(source, /void registrarNotificacoesNovoCapituloSupabase\(\{/);
  assert.match(source, /setArquivoImportadoErro\(""\);/);
  assert.match(
    source,
    /"Não consegui salvar esse capítulo\. Tente atualizar a página e criar novamente\."/,
  );
  assert.match(
    source,
    /finally \{[\s\S]*?criandoCapituloRef\.current = false;[\s\S]*?setProcessando\(false\);/,
  );
  antes("ordemNovoCapitulo = Math.max", ".insert({");
  antes("salvarObras(novasObras)", "void registrarDiarioNovoCapitulo");
  antes("void registrarDiarioNovoCapitulo", "void registrarNotificacoesNovoCapituloSupabase");
  antes(
    "void registrarNotificacoesNovoCapituloSupabase",
    "registrarNotificacaoNovoCapituloLocal(novaNotificacao)",
  );
});
