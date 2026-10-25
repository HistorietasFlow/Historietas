import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const layoutSource = readFileSync(
  new URL(
    "../../app/editar-obra/styles/editar-obra-layout-styles.ts",
    import.meta.url,
  ),
  "utf8",
);

const layoutStyles = [
  "mobileTopWaterFadeStyle",
  "desktopTopWaterFadeStyle",
  "pageStyle",
  "containerStyle",
  "titleHeaderStyle",
  "desktopTitleHeaderStyle",
  "headerTitleLinkStyle",
  "desktopHeaderTitleLinkStyle",
  "headerTitleTextStyle",
  "desktopHeaderTitleTextStyle",
  "errorBoxStyle",
  "errorTitleStyle",
  "errorTextStyle",
  "mainGridStyle",
  "formStyle",
  "desktopContainerStyle",
  "desktopMainGridStyle",
  "desktopFormStyle",
];

test("Editar Obra delega somente os estilos estáticos de layout", () => {
  assert.match(
    pageSource,
    /from "\.\/styles\/editar-obra-layout-styles";/,
  );
  for (const style of layoutStyles) {
    assert.doesNotMatch(pageSource, new RegExp(`const ${style}: CSSProperties`));
    assert.match(layoutSource, new RegExp(`export const ${style}: CSSProperties`));
  }
  assert.doesNotMatch(pageSource, /const topStyle: CSSProperties/);
  assert.match(layoutSource, /const topStyle: CSSProperties/);
});

test("layout preserva estilos, spreads e safeTextStyle compartilhado", () => {
  assert.match(
    layoutSource,
    /import \{ safeTextStyle \} from "\.\/editar-obra-shared-styles";/,
  );
  for (const trecho of [
    'height: "min(340px, 48vh)"',
    'height: "min(620px, 68vh)"',
    'background: "var(--historietas-editar-obra-bg-page, #000000)"',
    'width: "min(900px, calc(100% - 24px))"',
    "...topStyle",
    "...headerTitleLinkStyle",
    "...headerTitleTextStyle",
    "...safeTextStyle",
    "...containerStyle",
    'width: "min(1180px, calc(100% - 64px))"',
    "...mainGridStyle",
    "...formStyle",
    'gridTemplateColumns: "minmax(0, 760px)"',
    'maxWidth: "760px"',
  ]) {
    assert.ok(layoutSource.includes(trecho), trecho);
  }
});

test("página preserva o shell, fades e estados de renderização", () => {
  assert.match(pageSource, /useHistorietasTheme\(pageStyle\)/);
  assert.match(
    pageSource,
    /isDesktop && <div style=\{desktopTopWaterFadeStyle\} aria-hidden="true" \/>/,
  );
  assert.match(
    pageSource,
    /!isDesktop && <div style=\{mobileTopWaterFadeStyle\} aria-hidden="true" \/>/,
  );
  assert.match(
    pageSource,
    /<section style=\{isDesktop \? desktopContainerStyle : containerStyle\}>/,
  );
  assert.match(
    pageSource,
    /<header style=\{isDesktop \? desktopTitleHeaderStyle : titleHeaderStyle\}>/,
  );
  assert.match(
    pageSource,
    /style=\{isDesktop \? desktopHeaderTitleLinkStyle : headerTitleLinkStyle\}/,
  );
  assert.match(
    pageSource,
    /style=\{isDesktop \? desktopHeaderTitleTextStyle : headerTitleTextStyle\}/,
  );
  assert.match(pageSource, /<section style=\{errorBoxStyle\}>/);
  assert.match(pageSource, /<h2 style=\{errorTitleStyle\}>Não foi possível salvar<\/h2>/);
  assert.match(pageSource, /<p style=\{errorTextStyle\}>\{erro\}<\/p>/);
  assert.match(
    pageSource,
    /<section style=\{isDesktop \? desktopMainGridStyle : mainGridStyle\}>/,
  );
  assert.match(
    pageSource,
    /<form onSubmit=\{salvarEdicao\} style=\{isDesktop \? desktopFormStyle : formStyle\}>/,
  );
});
