import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/politica-de-privacidade/page.tsx", import.meta.url),
  "utf8",
);
const contentSource = readFileSync(
  new URL(
    "../../app/politica-de-privacidade/lib/politica-de-privacidade-content.ts",
    import.meta.url,
  ),
  "utf8",
);
const iconSource = readFileSync(
  new URL(
    "../../app/politica-de-privacidade/components/PoliticaPrivacidadeSvgIcon.tsx",
    import.meta.url,
  ),
  "utf8",
);
const stylesSource = readFileSync(
  new URL(
    "../../app/politica-de-privacidade/styles/politica-de-privacidade-styles.ts",
    import.meta.url,
  ),
  "utf8",
);

test("legal content and types moved without changing their contracts", () => {
  for (const declaration of [
    "TextoTraduzido",
    "IconName",
    "SecaoPrivacidade",
    "DestaquePrivacidade",
    "ULTIMA_ATUALIZACAO",
    "DESTAQUES_PRIVACIDADE",
    "SECOES_PRIVACIDADE",
    "traduzirTexto",
  ]) {
    assert.match(
      contentSource,
      new RegExp(`export (?:type |const |function )?${declaration}`),
    );
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
  assert.match(contentSource, /return texto\.pt/);

  const sections = [
    ["sobre-politica", "1"],
    ["dados-coletados", "2"],
    ["origem-dados", "3"],
    ["finalidades-bases", "4"],
    ["conteudo-publico", "5"],
    ["armazenamento-local", "6"],
    ["compartilhamento", "7"],
    ["transferencia-internacional", "8"],
    ["retencao", "9"],
    ["seguranca", "10"],
    ["direitos", "11"],
    ["criancas-adolescentes", "12"],
    ["alteracoes", "13"],
    ["contato", "14"],
  ];
  let previous = -1;
  for (const [id, number] of sections) {
    const index = contentSource.indexOf(`id: "${id}"`);
    assert.ok(index > previous);
    assert.match(contentSource.slice(index), new RegExp(`numero: "${number}"`));
    previous = index;
  }
});

test("dedicated SVG icon preserves names, forms, and accessibility", () => {
  assert.match(iconSource, /export function PoliticaPrivacidadeSvgIcon/);
  assert.doesNotMatch(pageSource, /function SvgIcon/);
  assert.match(pageSource, /PoliticaPrivacidadeSvgIcon/);
  for (const icon of [
    "arrowLeft",
    "arrowRight",
    "shield",
    "user",
    "database",
    "book",
    "activity",
    "settings",
    "eye",
    "device",
    "share",
    "globe",
    "clock",
    "lock",
    "check",
    "children",
    "refresh",
    "help",
    "info",
    "download",
    "alert",
  ]) {
    assert.match(contentSource, new RegExp(`\\| "${icon}"`));
    assert.match(iconSource, new RegExp(`${icon}:`));
  }
  assert.match(iconSource, /viewBox="0 0 24 24"/);
  assert.match(iconSource, /aria-hidden="true"/);
  assert.match(iconSource, /focusable="false"/);
  assert.match(iconSource, /strokeLinecap: "round"/);
  assert.match(iconSource, /strokeLinejoin: "round"/);
});

test("static styles moved while page keeps legal JSX and conditions", () => {
  assert.match(stylesSource, /export const politicaPrivacidadeCss/);
  assert.match(stylesSource, /data-historietas-privacidade-root="true"/);
  assert.match(stylesSource, /data-historietas-tema-visual="foco"/);
  assert.match(stylesSource, /max-width: 780px/);
  assert.match(stylesSource, /max-width: 620px/);
  assert.match(stylesSource, /prefers-reduced-motion/);
  assert.match(stylesSource, /color-mix/);
  assert.doesNotMatch(pageSource, /const politicaPrivacidadeCss/);
  assert.doesNotMatch(pageSource, /const pageStyle: CSSProperties/);
  assert.match(pageSource, /\{\`\$\{historietasThemeCss\}\$\{politicaPrivacidadeCss\}\`\}/);
  assert.match(pageSource, /useHistorietasLanguage/);
  assert.match(pageSource, /useHistorietasTheme/);
  assert.match(pageSource, /function t\(texto: TextoTraduzido\)/);
  assert.match(pageSource, /DESTAQUES_PRIVACIDADE\.map/);
  assert.match(pageSource, /SECOES_PRIVACIDADE\.map/);
  assert.match(pageSource, /secao\.paragrafos\.map/);
  assert.match(pageSource, /secao\.itens\?\.length/);
  assert.match(pageSource, /secao\.id === "conteudo-publico"/);
  assert.match(pageSource, /secao\.id === "armazenamento-local"/);
  assert.match(pageSource, /secao\.id === "seguranca"/);
  assert.match(pageSource, /secao\.id === "direitos" \|\| secao\.id === "contato"/);
  assert.match(pageSource, /href=\{\`#\$\{secao\.id\}\`\}/);
});
