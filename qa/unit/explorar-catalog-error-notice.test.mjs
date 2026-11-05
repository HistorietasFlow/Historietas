import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (arquivo) =>
  readFileSync(new URL(arquivo, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const componente = ler(
  "../../app/explorar/components/explorar-catalog-error-notice.tsx",
);
const pagina = ler("../../app/explorar/page.tsx");
const traducoes = ler("../../app/explorar/lib/explorar-translations.ts");

test("aviso diferencia indisponibilidade com e sem dados e oferece retry acessível", () => {
  assert.match(componente, /possuiDados\s*\?\s*"Não foi possível atualizar o catálogo agora\. Exibindo os dados disponíveis\."/);
  assert.match(componente, /:\s*"O catálogo está temporariamente indisponível\."/);
  assert.match(componente, /<div role="alert"/);
  assert.match(componente, /type="button"/);
  assert.match(componente, /disabled=\{carregando\}/);
  assert.match(componente, /aria-busy=\{carregando\}/);
  assert.match(componente, /onClick=\{onTentarNovamente\}/);
  assert.match(componente, /traduzirTextoExplorar\("Tentar novamente", language\)/);

  for (const texto of [
    "Tentar novamente",
    "Não foi possível atualizar o catálogo agora. Exibindo os dados disponíveis.",
    "O catálogo está temporariamente indisponível.",
  ]) {
    assert.ok(traducoes.includes(`"${texto}"`), texto);
  }
});

test("página não apresenta falha como catálogo vazio e repete só a operação necessária", () => {
  assert.match(pagina, /\{erroCatalogoExplorar && \(/);
  assert.match(pagina, /possuiDados=\{obrasLocais\.length > 0\}/);
  assert.match(pagina, /onTentarNovamente=\{tentarCarregarCatalogoNovamente\}/);
  assert.match(pagina, /totalResultados === 0 && !erroCatalogoExplorar/);
  assert.match(
    pagina,
    /if \(erroCatalogoExplorar === "paginacao"\) \{\s*void carregarMaisObrasCatalogo\(\);\s*return;/,
  );
  assert.match(
    pagina,
    /setVersaoRetryCatalogo\(\(versaoAtual\) => versaoAtual \+ 1\);/,
  );
  assert.doesNotMatch(pagina, /location\.reload|router\.refresh/);
});
