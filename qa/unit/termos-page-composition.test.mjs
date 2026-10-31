import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const headerSource = readFileSync(
  new URL(
    "../../app/termos/components/TermosHeaderHero.tsx",
    import.meta.url,
  ),
  "utf8",
);
const documentosSource = readFileSync(
  new URL(
    "../../app/termos/components/TermosDocumentosSection.tsx",
    import.meta.url,
  ),
  "utf8",
);
const supportingSource = readFileSync(
  new URL(
    "../../app/termos/components/TermosSupportingSections.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("hero preserva cabeçalho, hero, navegação e ícones", () => {
  assert.match(headerSource, /export function TermosHeaderHero/);
  assert.match(headerSource, /href="\/configuracoes"/);
  assert.match(headerSource, /aria-label=\{t\(/);
  assert.match(headerSource, /name="arrowLeft" size=\{25\} strokeWidth=\{2\.35\}/);
  assert.match(headerSource, /name="scale" size=\{31\} strokeWidth=\{2\.05\}/);
  assert.match(headerSource, /name="check" size=\{16\} strokeWidth=\{2\.35\}/);
  assert.match(headerSource, /INFORMAÇÕES LEGAIS/);
  assert.match(headerSource, /Conheça seus direitos e responsabilidades/);
});

test("seção de documentos preserva mapeamento, IDs, classes e ícones", () => {
  assert.match(documentosSource, /DOCUMENTOS_POLITICAS\.length/);
  assert.match(documentosSource, /DOCUMENTOS_POLITICAS\.map/);
  assert.match(documentosSource, /id="documentos-politicas-titulo"/);
  assert.match(documentosSource, /key=\{documento\.href\}/);
  assert.match(documentosSource, /href=\{documento\.href\}/);
  assert.match(documentosSource, /className="termos-document-link"/);
  assert.match(documentosSource, /documento\.temas\.map/);
  assert.match(documentosSource, /\$\{documento\.href\}-\$\{tema\.pt\}/);
  assert.match(documentosSource, /size=\{27\}[\s\S]*?strokeWidth=\{2\.05\}/);
  assert.match(documentosSource, /name="arrowRight" size=\{22\} strokeWidth=\{2\.35\}/);
});

test("seções de apoio preservam mapas, aside, IDs, links e ícones", () => {
  assert.match(supportingSource, /PRINCIPIOS_PLATAFORMA\.map/);
  assert.match(supportingSource, /key=\{principio\.titulo\.pt\}/);
  assert.match(supportingSource, /ETAPAS_LEITURA\.map/);
  assert.match(supportingSource, /key=\{etapa\.numero\}/);
  assert.match(supportingSource, /<aside style=\{noticeStyle\}>/);
  assert.match(supportingSource, /name="info" size=\{24\} strokeWidth=\{2\.1\}/);
  assert.match(supportingSource, /ATALHOS_POLITICAS\.map/);
  assert.match(supportingSource, /key=\{atalho\.href\}/);
  assert.match(supportingSource, /href=\{atalho\.href\}/);
  assert.match(supportingSource, /name="arrowRight" size=\{20\} strokeWidth=\{2\.25\}/);
  for (const id of [
    "principios-politicas-titulo",
    "leitura-politicas-titulo",
    "atalhos-politicas-titulo",
  ]) {
    assert.match(supportingSource, new RegExp(id));
  }
});
