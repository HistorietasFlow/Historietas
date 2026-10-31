import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/diretrizes-da-comunidade/page.tsx", import.meta.url),
  "utf8",
);
const contentSource = readFileSync(
  new URL(
    "../../app/diretrizes-da-comunidade/lib/diretrizes-da-comunidade-content.ts",
    import.meta.url,
  ),
  "utf8",
);
const iconSource = readFileSync(
  new URL(
    "../../app/diretrizes-da-comunidade/components/DiretrizesComunidadeSvgIcon.tsx",
    import.meta.url,
  ),
  "utf8",
);
const stylesSource = readFileSync(
  new URL(
    "../../app/diretrizes-da-comunidade/styles/diretrizes-da-comunidade-styles.ts",
    import.meta.url,
  ),
  "utf8",
);

test("content types and legal data moved without changing their contracts", () => {
  for (const declaration of [
    "TextoTraduzido",
    "IconName",
    "SecaoDiretriz",
    "PrincipioComunidade",
    "ULTIMA_ATUALIZACAO",
    "PRINCIPIOS_COMUNIDADE",
    "SECOES_DIRETRIZES",
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
    ["objetivo", "1"],
    ["respeito", "2"],
    ["odio-discriminacao", "3"],
    ["violencia-seguranca", "4"],
    ["menores", "5"],
    ["conteudo-sexual", "6"],
    ["autoria", "7"],
    ["fraude-spam", "8"],
    ["privacidade", "9"],
    ["classificacao-contexto", "10"],
    ["denuncias", "11"],
    ["moderacao", "12"],
    ["contestacao", "13"],
    ["atualizacoes", "14"],
    ["contato", "15"],
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
  assert.match(iconSource, /export function DiretrizesComunidadeSvgIcon/);
  assert.doesNotMatch(pageSource, /function SvgIcon/);
  assert.doesNotMatch(pageSource, /\bSvgIcon\b/);
  assert.match(pageSource, /DiretrizesComunidadeSvgIcon/);
  for (const icon of [
    "arrowLeft", "arrowRight", "users", "heart", "shield", "book",
    "copyright", "comment", "ban", "alert", "child", "flag", "scale",
    "refresh", "help", "check", "info", "eye", "lock", "spark",
  ]) {
    assert.match(contentSource, new RegExp(`\\| "${icon}"`));
    assert.match(iconSource, new RegExp(`${icon}:`));
  }
  assert.match(iconSource, /viewBox="0 0 24 24"/);
  assert.match(iconSource, /aria-hidden="true"/);
  assert.match(iconSource, /focusable="false"/);
  assert.match(iconSource, /fill: "none"/);
  assert.match(iconSource, /stroke: "currentColor"/);
  assert.match(iconSource, /strokeLinecap: "round"/);
  assert.match(iconSource, /strokeLinejoin: "round"/);
});

test("static styles moved while page keeps legal JSX and conditions", () => {
  assert.match(stylesSource, /export const diretrizesCss/);
  assert.match(stylesSource, /data-historietas-diretrizes-root="true"/);
  assert.match(stylesSource, /data-historietas-tema-visual="foco"/);
  assert.match(stylesSource, /max-width: 780px/);
  assert.match(stylesSource, /max-width: 620px/);
  assert.match(stylesSource, /prefers-reduced-motion/);
  assert.match(stylesSource, /color-mix/);
  assert.doesNotMatch(pageSource, /const diretrizesCss/);
  assert.doesNotMatch(pageSource, /const pageStyle: CSSProperties/);
  assert.match(pageSource, /\{`\$\{historietasThemeCss\}\$\{diretrizesCss\}`\}/);
  assert.match(pageSource, /useHistorietasLanguage/);
  assert.match(pageSource, /useHistorietasTheme/);
  assert.match(pageSource, /function t\(texto: TextoTraduzido\)/);
  assert.match(pageSource, /PRINCIPIOS_COMUNIDADE\.map/);
  assert.equal(pageSource.match(/SECOES_DIRETRIZES\.map/g)?.length, 2);
  assert.match(pageSource, /secao\.permitido\?\.length/);
  assert.match(pageSource, /secao\.proibido\?\.length/);
  assert.match(pageSource, /secao\.id === "denuncias" \|\|/);
  assert.match(pageSource, /href=\{`#\$\{secao\.id\}`\}/);
  assert.match(pageSource, /className="diretrizes-toc-link"/);
});
