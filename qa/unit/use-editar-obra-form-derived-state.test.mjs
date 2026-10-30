import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const source = readFileSync(
  new URL(
    "../../app/editar-obra/hooks/use-editar-obra-form-derived-state.ts",
    import.meta.url,
  ),
  "utf8",
);

test("hook preserva os useMemo de obra, tags e progresso", () => {
  assert.match(source, /export function useEditarObraFormDerivedState\(/);
  assert.match(
    source,
    /const obraAtual = useMemo\(\(\) => \{[\s\S]*?obras\.find\(\(obra\) => obra\.id === obraId\) \|\| null;[\s\S]*?\}, \[obras, obraId\]\);/,
  );
  assert.match(
    source,
    /const tagsTratadas = useMemo\(\(\) => \{[\s\S]*?prepararTagsEdicaoObra\(tags, LIMITE_TAGS_OBRA\);[\s\S]*?\}, \[tags\]\);/,
  );
  assert.match(
    source,
    /const progresso = useMemo\(\(\) => calcularProgressoFormularioEdicaoObra\(\{[\s\S]*?titulo,[\s\S]*?autor,[\s\S]*?generoFinal,[\s\S]*?generoPersonalizadoValido,[\s\S]*?formatoFinal,[\s\S]*?formatoPersonalizadoValido,[\s\S]*?classificacaoIndicativa,[\s\S]*?avisosConteudo18,[\s\S]*?sinopse,[\s\S]*?\}\), \[[\s\S]*?titulo,[\s\S]*?autor,[\s\S]*?generoFinal,[\s\S]*?generoPersonalizadoValido,[\s\S]*?formatoFinal,[\s\S]*?formatoPersonalizadoValido,[\s\S]*?classificacaoIndicativa,[\s\S]*?avisosConteudo18,[\s\S]*?sinopse,[\s\S]*?\]\);/,
  );
});

test("hook preserva valores derivados, navegação e preview do autor", () => {
  assert.match(
    source,
    /calcularValoresDerivadosFormularioEdicaoObra\(\{[\s\S]*?formato,[\s\S]*?genero,[\s\S]*?tagPersonalizada,[\s\S]*?usarTagPersonalizada,[\s\S]*?formatoPersonalizado,[\s\S]*?generoPersonalizado,[\s\S]*?outroFormatoValue: OUTRO_FORMATO_VALUE,[\s\S]*?outroGeneroValue: OUTRO_GENERO_VALUE,[\s\S]*?limiteCaracteresFormatoGeneroPersonalizado:[\s\S]*?LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO,[\s\S]*?limiteCaracteresTagPersonalizada: LIMITE_CARACTERES_TAG_PERSONALIZADA,/,
  );
  assert.match(
    source,
    /const \{ minhaObraHref \} = obterHrefsObraEditarObra\(obraAtual, titulo\);/,
  );
  assert.match(source, /const autorProfileAtivo = nomeAutorProfile\.trim\(\);/);
  assert.match(source, /const autorPreview = autorProfileAtivo \|\| autor\.trim\(\);/);
});

test("página delega o estado derivado e mantém salvarEdicao", () => {
  assert.match(
    pageSource,
    /import \{ useEditarObraFormDerivedState \} from "\.\/hooks\/use-editar-obra-form-derived-state";/,
  );
  assert.match(
    pageSource,
    /\} = useEditarObraFormDerivedState\(\{[\s\S]*?obras,[\s\S]*?obraId,[\s\S]*?tags,[\s\S]*?formato,[\s\S]*?genero,[\s\S]*?tagPersonalizada,[\s\S]*?usarTagPersonalizada,[\s\S]*?formatoPersonalizado,[\s\S]*?generoPersonalizado,[\s\S]*?titulo,[\s\S]*?autor,[\s\S]*?classificacaoIndicativa,[\s\S]*?avisosConteudo18,[\s\S]*?sinopse,[\s\S]*?nomeAutorProfile,/,
  );
  assert.match(pageSource, /async function salvarEdicao\(event: FormEvent<HTMLFormElement>\)/);
  assert.doesNotMatch(pageSource, /const obraAtual = useMemo/);
  assert.doesNotMatch(source, /supabase|localStorage|sessionStorage|\.from\(/);
});
