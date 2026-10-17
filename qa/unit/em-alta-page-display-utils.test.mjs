import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL(
    "../../app/em-alta/lib/em-alta-page-display-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);
const js = typescript.transpileModule(modulo, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const utils = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`
);

test("protege as coleções pessoais sem alterar as listas autenticadas", () => {
  const favoritas = ["obra-favorita"];
  const concluidas = ["obra-concluida"];

  assert.strictEqual(
    utils.obterObrasFavoritasProtegidasEmAlta(true, favoritas),
    favoritas,
  );
  assert.strictEqual(
    utils.obterObrasConcluidasProtegidasEmAlta(true, concluidas),
    concluidas,
  );
  assert.deepEqual(
    utils.obterObrasFavoritasProtegidasEmAlta(false, favoritas),
    [],
  );
  assert.deepEqual(
    utils.obterObrasConcluidasProtegidasEmAlta(false, concluidas),
    [],
  );
});

test("preserva o título do cabeçalho para carregamento, atividade e fallback", () => {
  assert.equal(utils.obterTituloCabecalhoEmAlta(true, true), "ISTORIETAS");
  assert.equal(
    utils.obterTituloCabecalhoEmAlta(false, true),
    "ISTORIETAS POPULARES",
  );
  assert.equal(
    utils.obterTituloCabecalhoEmAlta(false, false),
    "ISTORIETAS PUBLICADAS",
  );
});

test("a fronteira de exibição permanece pura e a página delega somente os dados derivados", () => {
  for (const nome of [
    "obterObrasFavoritasProtegidasEmAlta",
    "obterObrasConcluidasProtegidasEmAlta",
    "obterTituloCabecalhoEmAlta",
  ]) {
    assert.match(modulo, new RegExp(`export function ${nome}\\b`));
    assert.match(pagina, new RegExp(`\\b${nome}\\b`));
  }

  assert.match(pagina, /from "\.\/lib\/em-alta-page-display-utils";/);
  assert.match(
    pagina,
    /const obrasFavoritasProtegidas = obterObrasFavoritasProtegidasEmAlta\(/,
  );
  assert.match(
    pagina,
    /const obrasConcluidasProtegidas = obterObrasConcluidasProtegidasEmAlta\(/,
  );
  assert.match(pagina, /const tituloCabecalho = obterTituloCabecalhoEmAlta\(/);
  assert.match(pagina, /useEmAltaRankingLoader\(/);
  assert.match(pagina, /useEmAltaRankingCollectionActions\(/);
  assert.doesNotMatch(pagina, /async function alternarFavorito\(/);
  assert.doesNotMatch(pagina, /async function alternarConcluido\(/);

  for (const proibido of [
    /react/i,
    /\buse[A-Z]\w*\b/,
    /supabase/i,
    /localStorage/,
    /\bwindow\b/,
    /\bdocument\b/,
    /<[A-Z][\w.]*\s+[\w-]+=/,
  ]) {
    assert.doesNotMatch(modulo, proibido);
  }
});
