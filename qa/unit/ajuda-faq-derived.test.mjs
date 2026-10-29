import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagina = await readFile("app/ajuda/page.tsx", "utf8");
const faq = await readFile("app/ajuda/lib/ajuda-faq-derived.ts", "utf8");

test("derivações da FAQ preservam categoria, busca, idioma e fallback", () => {
  for (const contrato of [
    "export function filtrarPerguntasAjuda",
    "normalizarTexto(busca)",
    'categoriaAtiva === "todos"',
    "item.categoria === categoriaAtiva",
    "if (!buscaNormalizada)",
    "item.pergunta",
    "item.resposta",
    "item.palavrasChave",
    "traduzirTexto(",
    "conteudo.includes(",
    "export function obterCategoriaAjudaSelecionada",
    "categoria.id === categoriaAtiva",
    "categorias[0]",
  ]) assert.ok(faq.includes(contrato), contrato);

  assert.ok(
    faq.indexOf("item.pergunta") < faq.indexOf("item.resposta") &&
      faq.indexOf("item.resposta") < faq.indexOf("item.palavrasChave"),
  );
});

test("a página mantém useMemo local com as três dependências e delega derivações", () => {
  assert.match(pagina, /useMemo\(\(\) => \{/);
  assert.match(pagina, /filtrarPerguntasAjuda\(\{/);
  assert.match(pagina, /perguntas: PERGUNTAS_AJUDA,/);
  assert.match(
    pagina,
    /\}, \[\s*busca,\s*categoriaAtiva,\s*language,\s*\]\)/,
  );
  assert.match(pagina, /obterCategoriaAjudaSelecionada\(\s*CATEGORIAS_AJUDA,\s*categoriaAtiva,/);
  assert.doesNotMatch(pagina, /PERGUNTAS_AJUDA\.filter/);
});
