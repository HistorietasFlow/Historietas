import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL("../../app/ajuda/components/ajuda-technical-support-form.tsx", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/ajuda/page.tsx", import.meta.url),
  "utf8",
);

test("o formulário técnico preserva controles, limites, callbacks e envio", () => {
  assert.match(componente, /<form onSubmit=\{onSubmit\} style=\{supportFormStyle\}>/);
  assert.match(componente, /CATEGORIAS_PROBLEMA_TECNICO\.map/);
  assert.match(componente, /key=\{categoria\.valor\} value=\{categoria\.valor\}/);
  assert.match(componente, /onCategoriaChange\(\s*event\.target\.value,/);
  assert.match(componente, /type="url"/);
  assert.match(componente, /maxLength=\{700\}/);
  assert.match(componente, /onPaginaChange\(\s*event\.target\.value,/);
  assert.match(componente, /type="text"/);
  assert.match(componente, /maxLength=\{120\}/);
  assert.match(componente, /\{titulo\.length\}\/120/);
  assert.match(componente, /onTituloChange\(\s*event\.target\.value,/);
  assert.match(componente, /maxLength=\{3000\}/);
  assert.match(componente, /rows=\{6\}/);
  assert.match(componente, /\{descricao\.length\}\/3000/);
  assert.match(componente, /onDescricaoChange\(\s*event\.target\.value,/);
  assert.match(componente, /O navegador e o tamanho da tela serão enviados automaticamente/);
  assert.match(componente, /type="submit"/);
  assert.match(componente, /className="ajuda-submit-ticket-button"/);
  assert.match(componente, /disabled=\{enviando \|\| usuarioAutenticado === false\}/);
  assert.match(componente, /pt: "Enviando\.\.\."/);
  assert.match(componente, /pt: "Enviar problema técnico"/);
  assert.doesNotMatch(componente, /supabase|useEffect|useState|normalizarCategoriaProblemaTecnico/);
});

test("a página delega submit, normalização e setters ao hook de suporte", () => {
  assert.match(
    pagina,
    /import \{\s*AjudaTechnicalSupportForm,\s*\} from "\.\/components\/ajuda-technical-support-form";/,
  );
  assert.match(
    pagina,
    /import \{ useAjudaTechnicalSupport \} from "\.\/hooks\/use-ajuda-technical-support";/,
  );
  assert.match(pagina, /atualizarCategoriaProblema,/);
  assert.doesNotMatch(pagina, /async function enviarProblemaTecnico\(/);
  assert.doesNotMatch(pagina, /normalizarCategoriaProblemaTecnico/);
  assert.doesNotMatch(pagina, /setCategoriaProblema\(/);
  assert.match(pagina, /onPaginaChange=\{setPaginaProblema\}/);
  assert.match(pagina, /onTituloChange=\{setTituloProblema\}/);
  assert.match(pagina, /onDescricaoChange=\{setDescricaoProblema\}/);
  assert.match(pagina, /onSubmit=\{enviarProblemaTecnico\}/);
  assert.match(pagina, /onCategoriaChange=\{atualizarCategoriaProblema\}/);
  assert.doesNotMatch(pagina, /<form onSubmit=\{enviarProblemaTecnico\}/);
});
