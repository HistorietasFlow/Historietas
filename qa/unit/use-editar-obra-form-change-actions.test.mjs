import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const source = readFileSync(
  new URL(
    "../../app/editar-obra/hooks/use-editar-obra-form-change-actions.ts",
    import.meta.url,
  ),
  "utf8",
);

test("hook centraliza marcarAlteracao e preserva os handlers simples", () => {
  assert.match(source, /export function useEditarObraFormChangeActions\(/);
  assert.match(source, /function marcarAlteracao\(\) \{[\s\S]*?if \(salvou\) \{[\s\S]*?setSalvou\(false\);[\s\S]*?if \(erro\) \{[\s\S]*?setErro\(""\);/);
  assert.match(source, /function alterarTitulo\(novoTitulo: string\) \{[\s\S]*?setTitulo\(novoTitulo\);[\s\S]*?marcarAlteracao\(\);/);
  assert.match(source, /function alterarAutor\(novoAutor: string\) \{[\s\S]*?setAutor\(novoAutor\);[\s\S]*?marcarAlteracao\(\);/);
  assert.match(source, /function alterarSinopse\(novaSinopse: string\) \{[\s\S]*?setSinopse\(novaSinopse\);[\s\S]*?marcarAlteracao\(\);/);
});

test("hook preserva regras de formato, gênero e classificação", () => {
  assert.match(source, /novoFormato !== OUTRO_FORMATO_VALUE/);
  assert.match(source, /novoGenero !== OUTRO_GENERO_VALUE/);
  assert.match(source, /limparTextoPersonalizado\([\s\S]*?LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO/);
  assert.match(source, /!ehClassificacao18\(novaClassificacao\)/);
  assert.match(source, /setAvisosConteudo18\(\[\]\);/);
  assert.match(source, /avisosAtuais\.includes\(aviso\)[\s\S]*?avisosAtuais\.filter\(\(item\) => item !== aviso\)[\s\S]*?\[\.\.\.avisosAtuais, aviso\]/);
  assert.doesNotMatch(source, /useCallback|useState|useEffect|supabase|localStorage/);
});

test("página delega handlers, mantém salvarEdicao e repassa marcarAlteracao", () => {
  assert.match(pageSource, /import \{ useEditarObraFormChangeActions \} from "\.\/hooks\/use-editar-obra-form-change-actions";/);
  assert.match(pageSource, /\} = useEditarObraFormChangeActions\(/);
  assert.match(pageSource, /onTituloChange=\{alterarTitulo\}/);
  assert.match(pageSource, /onFormatoChange=\{alterarFormato\}/);
  assert.match(pageSource, /onClassificacaoChange=\{alterarClassificacaoIndicativa\}/);
  assert.match(pageSource, /onSinopseChange=\{alterarSinopse\}/);
  assert.match(pageSource, /useEditarObraAssetActions\(\{[\s\S]*?marcarAlteracao,/);
  assert.match(pageSource, /useEditarObraTagActions\(\{[\s\S]*?marcarAlteracao,/);
  assert.match(pageSource, /async function salvarEdicao\(event: FormEvent<HTMLFormElement>\)/);
  assert.doesNotMatch(pageSource, /function marcarAlteracao\(\)/);
});
