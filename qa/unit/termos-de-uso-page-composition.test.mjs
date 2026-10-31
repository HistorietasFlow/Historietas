import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const pageSource = source("../../app/termos-de-uso/page.tsx");
const overviewSource = source(
  "../../app/termos-de-uso/components/TermosDeUsoOverview.tsx",
);
const documentContentSource = source(
  "../../app/termos-de-uso/components/TermosDeUsoDocumentContent.tsx",
);
const footerSource = source(
  "../../app/termos-de-uso/components/TermosDeUsoFooter.tsx",
);

test("page keeps language, theme, and the three visual compositions", () => {
  assert.match(pageSource, /useHistorietasLanguage/);
  assert.match(pageSource, /useHistorietasTheme/);
  assert.match(pageSource, /function t\(texto: TextoTraduzido\)/);
  assert.match(pageSource, /historietasThemeCss/);
  assert.match(pageSource, /termosUsoCss/);
  assert.match(pageSource, /data-historietas-termos-uso-root="true"/);
  assert.match(pageSource, /<TermosDeUsoOverview t=\{t\} \/>/);
  assert.match(pageSource, /<TermosDeUsoDocumentContent t=\{t\} \/>/);
  assert.match(pageSource, /<TermosDeUsoFooter t=\{t\} \/>/);

  for (const pattern of [
    /DESTAQUES_TERMOS\.map/,
    /SECOES_TERMOS\.map/,
    /secao\.paragrafos\.map/,
    /secao\.id === "direitos-autorais"/,
  ]) {
    assert.doesNotMatch(pageSource, pattern);
  }
});
test("overview preserves header, hero, summary, and highlights", () => {
  for (const fragment of [
    "<header",
    'href="/termos"',
    "arrowLeft",
    "size={25}",
    "strokeWidth={2.35}",
    "heroStyle",
    'name="file"',
    "size={31}",
    'name="check"',
    "ULTIMA_ATUALIZACAO",
    "<aside",
    'aria-labelledby="destaques-termos-uso"',
    'id="destaques-termos-uso"',
    "DESTAQUES_TERMOS.map",
    "key={destaque.titulo.pt}",
    "termos-uso-highlight",
    "termos-uso-highlight-icon",
    "termos-uso-highlight-copy",
  ]) {
    assert.ok(overviewSource.includes(fragment), fragment);
  }
});

test("document content preserves the index, legal sections, and conditional links", () => {
  assert.equal(
    (documentContentSource.match(/SECOES_TERMOS\.map/g) || []).length,
    2,
  );
  for (const fragment of [
    "<nav",
    "termos-uso-toc-link",
    "href={`#${secao.id}`}",
    'className="termos-uso-section"',
    "aria-labelledby={`${secao.id}-titulo`}",
    "secao.paragrafos.map",
    "secao.itens?.length",
    "termos-uso-list-check",
    'secao.id === "direitos-autorais"',
    'secao.id === "encerramento"',
    'secao.id === "contato"',
    'href="/ajuda"',
    'href="/configuracoes"',
  ]) {
    assert.ok(documentContentSource.includes(fragment), fragment);
  }
});

test("footer preserves its semantic container, link, and icons", () => {
  for (const fragment of [
    "<footer",
    'name="scale"',
    "size={24}",
    'href="/termos"',
    'name="arrowRight"',
    "size={19}",
    "footerStyle",
  ]) {
    assert.ok(footerSource.includes(fragment), fragment);
  }
});
