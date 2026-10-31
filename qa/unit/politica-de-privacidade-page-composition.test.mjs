import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/politica-de-privacidade/page.tsx", import.meta.url),
  "utf8",
);
const overviewSource = readFileSync(
  new URL(
    "../../app/politica-de-privacidade/components/PoliticaPrivacidadeOverview.tsx",
    import.meta.url,
  ),
  "utf8",
);
const documentContentSource = readFileSync(
  new URL(
    "../../app/politica-de-privacidade/components/PoliticaPrivacidadeDocumentContent.tsx",
    import.meta.url,
  ),
  "utf8",
);
const footerSource = readFileSync(
  new URL(
    "../../app/politica-de-privacidade/components/PoliticaPrivacidadeFooter.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("page keeps language, theme, and the visual composition boundary", () => {
  assert.match(pageSource, /useHistorietasLanguage/);
  assert.match(pageSource, /useHistorietasTheme/);
  assert.match(pageSource, /function t\(texto: TextoTraduzido\)/);
  assert.match(pageSource, /data-historietas-privacidade-root="true"/);
  assert.match(pageSource, /historietasThemeCss\}\$\{politicaPrivacidadeCss/);
  assert.match(pageSource, /<PoliticaPrivacidadeOverview t=\{t\} \/>/);
  assert.match(pageSource, /<PoliticaPrivacidadeDocumentContent t=\{t\} \/>/);
  assert.match(pageSource, /<PoliticaPrivacidadeFooter t=\{t\} \/>/);
  assert.doesNotMatch(pageSource, /DESTAQUES_PRIVACIDADE\.map/);
  assert.doesNotMatch(pageSource, /SECOES_PRIVACIDADE\.map/);
});

test("overview preserves the header, hero, notice, and highlights", () => {
  for (const fragment of [
    'href="/termos"',
    'name="arrowLeft" size={25} strokeWidth={2.35}',
    'name="shield" size={31} strokeWidth={2.05}',
    'name="check" size={16} strokeWidth={2.35}',
    "ULTIMA_ATUALIZACAO",
    "importantNoticeStyle",
    'aria-labelledby="destaques-politica-privacidade"',
    "DESTAQUES_PRIVACIDADE.map",
    "key={destaque.titulo.pt}",
    'className="privacidade-highlight"',
    'className="privacidade-highlight-icon"',
    'className="privacidade-highlight-copy"',
    'size={24}',
    'strokeWidth={2.05}',
  ]) {
    assert.ok(overviewSource.includes(fragment), fragment);
  }
});

test("document content preserves navigation, legal sections, links, and conditions", () => {
  for (const fragment of [
    'className="privacidade-content-layout"',
    "SECOES_PRIVACIDADE.map",
    'className="privacidade-toc-link"',
    'href={`#${secao.id}`}',
    'className="privacidade-section"',
    'aria-labelledby={`${secao.id}-titulo`}',
    "secao.paragrafos.map",
    "secao.itens?.length",
    'className="privacidade-list-check"',
    'secao.id === "conteudo-publico"',
    'secao.id === "armazenamento-local"',
    'secao.id === "seguranca"',
    'secao.id === "direitos" || secao.id === "contato"',
    'href="/configuracoes"',
    'href="/ajuda"',
    'className="privacidade-alert-box"',
  ]) {
    assert.ok(documentContentSource.includes(fragment), fragment);
  }
  assert.equal(
    documentContentSource.match(/SECOES_PRIVACIDADE\.map/g)?.length,
    2,
  );
});

test("footer preserves the related-documents link and iconography", () => {
  for (const fragment of [
    "footerStyle",
    'name="shield" size={24} strokeWidth={2.05}',
    'href="/termos"',
    'name="arrowRight" size={19} strokeWidth={2.3}',
  ]) {
    assert.ok(footerSource.includes(fragment), fragment);
  }
});
