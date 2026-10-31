import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/termos-de-uso/page.tsx", import.meta.url),
  "utf8",
);
const contentSource = readFileSync(
  new URL(
    "../../app/termos-de-uso/lib/termos-de-uso-content.ts",
    import.meta.url,
  ),
  "utf8",
);
const iconSource = readFileSync(
  new URL(
    "../../app/termos-de-uso/components/TermosDeUsoSvgIcon.tsx",
    import.meta.url,
  ),
  "utf8",
);
const stylesSource = readFileSync(
  new URL(
    "../../app/termos-de-uso/styles/termos-de-uso-styles.ts",
    import.meta.url,
  ),
  "utf8",
);
const overviewSource = readFileSync(
  new URL(
    "../../app/termos-de-uso/components/TermosDeUsoOverview.tsx",
    import.meta.url,
  ),
  "utf8",
);
const documentContentSource = readFileSync(
  new URL(
    "../../app/termos-de-uso/components/TermosDeUsoDocumentContent.tsx",
    import.meta.url,
  ),
  "utf8",
);
const footerSource = readFileSync(
  new URL(
    "../../app/termos-de-uso/components/TermosDeUsoFooter.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("conteúdo legal e tipos foram movidos sem alterar contratos", () => {
  for (const declaration of [
    "TextoTraduzido",
    "IconName",
    "SecaoTermos",
    "DestaqueTermos",
    "ULTIMA_ATUALIZACAO",
    "DESTAQUES_TERMOS",
    "SECOES_TERMOS",
    "traduzirTexto",
  ]) {
    assert.match(contentSource, new RegExp(`export (?:type |const |function )?${declaration}`));
    assert.doesNotMatch(
      pageSource,
      new RegExp(`^(?:type|const|function) ${declaration}`, "m"),
    );
  }

  assert.match(contentSource, /pt: "5 de agosto de 2026"/);
  assert.match(contentSource, /en: "August 5, 2026"/);
  assert.match(contentSource, /es: "5 de agosto de 2026"/);
  assert.match(contentSource, /if \(language === "en"\)/);
  assert.match(contentSource, /if \(language === "es"\)/);
  assert.match(contentSource, /return texto\.pt;/);

  const sections = [
    ["aceitacao", "1"],
    ["conta", "2"],
    ["publicacoes", "3"],
    ["condutas-proibidas", "4"],
    ["comunidade", "5"],
    ["moderacao", "6"],
    ["direitos-autorais", "7"],
    ["servico", "8"],
    ["encerramento", "9"],
    ["responsabilidades", "10"],
    ["alteracoes", "11"],
    ["legislacao", "12"],
    ["contato", "13"],
  ];
  let previous = -1;
  for (const [id, numero] of sections) {
    const index = contentSource.indexOf(`id: "${id}"`);
    assert.ok(index > previous);
    assert.match(contentSource.slice(index), new RegExp(`numero: "${numero}"`));
    previous = index;
  }
});

test("ícone SVG dedicado preserva todos os nomes e atributos acessíveis", () => {
  assert.match(iconSource, /export function TermosDeUsoSvgIcon/);
  assert.doesNotMatch(pageSource, /function SvgIcon/);
  for (const icon of [
    "arrowLeft", "arrowRight", "file", "user", "book", "copyright",
    "shield", "comment", "alert", "settings", "ban", "server", "scale",
    "refresh", "help", "check", "info",
  ]) {
    assert.match(contentSource, new RegExp(`\\| "${icon}"`));
    assert.match(iconSource, new RegExp(`${icon}:`));
  }
  assert.match(iconSource, /viewBox="0 0 24 24"/);
  assert.match(iconSource, /aria-hidden="true"/);
  assert.match(iconSource, /focusable="false"/);
  assert.doesNotMatch(pageSource, /TermosDeUsoSvgIcon/);
  assert.match(overviewSource, /TermosDeUsoSvgIcon/);
  assert.match(documentContentSource, /TermosDeUsoSvgIcon/);
  assert.match(footerSource, /TermosDeUsoSvgIcon/);
});

test("estilos estáticos e JSX jurídico permanecem nas fronteiras corretas", () => {
  assert.match(stylesSource, /export const termosUsoCss/);
  assert.match(stylesSource, /data-historietas-tema-visual="foco"/);
  assert.match(stylesSource, /max-width: 780px/);
  assert.match(stylesSource, /max-width: 620px/);
  assert.match(stylesSource, /prefers-reduced-motion/);
  assert.match(stylesSource, /color-mix/);
  assert.doesNotMatch(pageSource, /const termosUsoCss/);
  assert.doesNotMatch(pageSource, /const pageStyle: CSSProperties/);
  assert.match(pageSource, /\{`\$\{historietasThemeCss\}\$\{termosUsoCss\}`\}/);
  assert.match(pageSource, /useHistorietasLanguage/);
  assert.match(pageSource, /useHistorietasTheme/);
  assert.match(pageSource, /function t\(texto: TextoTraduzido\)/);
  assert.doesNotMatch(pageSource, /DESTAQUES_TERMOS\.map/);
  assert.doesNotMatch(pageSource, /SECOES_TERMOS\.map/);
  assert.doesNotMatch(pageSource, /secao\.paragrafos\.map/);
  assert.doesNotMatch(pageSource, /secao\.itens\?\.length/);
  assert.doesNotMatch(pageSource, /secao\.id === "direitos-autorais"/);
  assert.doesNotMatch(pageSource, /secao\.id === "encerramento"/);
  assert.doesNotMatch(pageSource, /secao\.id === "contato"/);
  assert.match(overviewSource, /DESTAQUES_TERMOS\.map/);
  assert.match(documentContentSource, /SECOES_TERMOS\.map/);
  assert.match(documentContentSource, /secao\.paragrafos\.map/);
  assert.match(documentContentSource, /secao\.itens\?\.length/);
  assert.match(documentContentSource, /secao\.id === "direitos-autorais"/);
  assert.match(documentContentSource, /secao\.id === "encerramento"/);
  assert.match(documentContentSource, /secao\.id === "contato"/);
  assert.match(documentContentSource, /href=\{`#\$\{secao\.id\}`\}/);
});
