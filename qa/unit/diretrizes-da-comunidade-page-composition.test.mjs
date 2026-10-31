import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/diretrizes-da-comunidade/page.tsx", import.meta.url),
  "utf8",
);
const overviewSource = readFileSync(
  new URL(
    "../../app/diretrizes-da-comunidade/components/DiretrizesComunidadeOverview.tsx",
    import.meta.url,
  ),
  "utf8",
);
const documentContentSource = readFileSync(
  new URL(
    "../../app/diretrizes-da-comunidade/components/DiretrizesComunidadeDocumentContent.tsx",
    import.meta.url,
  ),
  "utf8",
);
const footerSource = readFileSync(
  new URL(
    "../../app/diretrizes-da-comunidade/components/DiretrizesComunidadeFooter.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("page keeps language, theme, local translation, and the composition boundary", () => {
  assert.match(pageSource, /useHistorietasLanguage/);
  assert.match(pageSource, /useHistorietasTheme/);
  assert.match(pageSource, /function t\(texto: TextoTraduzido\)/);
  assert.match(pageSource, /data-historietas-diretrizes-root="true"/);
  assert.match(pageSource, /historietasThemeCss\}\$\{diretrizesCss/);
  assert.match(pageSource, /<DiretrizesComunidadeOverview t=\{t\} \/>/);
  assert.match(pageSource, /<DiretrizesComunidadeDocumentContent t=\{t\} \/>/);
  assert.match(pageSource, /<DiretrizesComunidadeFooter t=\{t\} \/>/);
  assert.doesNotMatch(pageSource, /PRINCIPIOS_COMUNIDADE\.map/);
  assert.doesNotMatch(pageSource, /SECOES_DIRETRIZES\.map/);
  assert.doesNotMatch(pageSource, /secao\.permitido\?\.length/);
  assert.doesNotMatch(pageSource, /secao\.proibido\?\.length/);
  assert.doesNotMatch(pageSource, /secao\.id === "denuncias" \|\|/);
});

test("overview preserves header, hero, summary, and principles", () => {
  for (const fragment of [
    'href="/termos"',
    'name="arrowLeft" size={25} strokeWidth={2.35}',
    'name="users" size={31} strokeWidth={2.05}',
    'name="check" size={16} strokeWidth={2.35}',
    "ULTIMA_ATUALIZACAO",
    "importantNoticeStyle",
    'aria-labelledby="principios-diretrizes"',
    'id="principios-diretrizes"',
    "PRINCIPIOS_COMUNIDADE.map",
    "key={principio.titulo.pt}",
    'className="diretrizes-principle"',
    'className="diretrizes-principle-icon"',
    'className="diretrizes-principle-copy"',
  ]) {
    assert.ok(overviewSource.includes(fragment), fragment);
  }
});

test("document content preserves navigation, sections, rules, and help condition", () => {
  for (const fragment of [
    'className="diretrizes-content-layout"',
    'className="diretrizes-toc-link"',
    'href={`#${secao.id}`}',
    'className="diretrizes-section"',
    'aria-labelledby={`${secao.id}-titulo`}',
    "secao.paragrafos.map",
    "secao.permitido?.length",
    "secao.proibido?.length",
    'className="diretrizes-rule-box diretrizes-rule-box-allowed"',
    'className="diretrizes-rule-box diretrizes-rule-box-prohibited"',
    'className="diretrizes-list-dot"',
    'secao.id === "denuncias" ||',
    'secao.id === "contestacao" ||',
    'secao.id === "contato"',
    'href="/ajuda"',
  ]) {
    assert.ok(documentContentSource.includes(fragment), fragment);
  }
  assert.equal(
    documentContentSource.match(/SECOES_DIRETRIZES\.map/g)?.length,
    2,
  );
});

test("footer preserves semantics, users icon, and related documents link", () => {
  for (const fragment of [
    "<footer",
    'name="users" size={24} strokeWidth={2.05}',
    'href="/termos"',
    'name="arrowRight"',
  ]) {
    assert.ok(footerSource.includes(fragment), fragment);
  }
});
