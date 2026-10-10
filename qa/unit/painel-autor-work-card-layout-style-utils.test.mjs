import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-work-card-layout-style-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);

test("estilos estruturais dos cards preservam o contrato visual", () => {
  for (const name of [
    "sectionStyle",
    "worksGridStyle",
    "workCardStyle",
    "coverLinkStyle",
    "coverGlowStyle",
    "workContentStyle",
    "statusRowStyle",
    "publishedStatusStyle",
    "draftStatusStyle",
  ]) {
    assert.match(source, new RegExp(`export const ${name}: CSSProperties`));
  }

  assert.match(
    source,
    /import \{ safeTextStyle \} from "\.\/painel-autor-desktop-header-style-utils";/,
  );
  assert.match(source, /gridTemplateColumns: "repeat\(2, minmax\(0, 1fr\)\)"/);
  assert.match(source, /overflow: "visible"/);
  assert.match(source, /textDecorationLine: "none"/);
  assert.match(source, /display: "none"/);
  assert.match(source, /padding: "28px 42px 9px 10px"/);
  assert.match(source, /pointerEvents: "none"/);
  assert.match(source, /fontSize: "8px"/);
  assert.match(source, /\.\.\.safeTextStyle/);
  assert.match(source, /\.\.\.publishedStatusStyle/);
});

test("página delega os estilos e mantém composições desktop e consumidores", () => {
  assert.match(
    page,
    /from "\.\/lib\/painel-autor-work-card-layout-style-utils";/,
  );

  for (const name of [
    "sectionStyle",
    "worksGridStyle",
    "workCardStyle",
    "coverLinkStyle",
    "coverGlowStyle",
    "workContentStyle",
    "statusRowStyle",
    "publishedStatusStyle",
    "draftStatusStyle",
  ]) {
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties`));
  }

  assert.match(page, /const desktopSectionStyle: CSSProperties = \{\s*\.\.\.sectionStyle,/);
  assert.match(page, /const desktopWorksGridStyle: CSSProperties = \{\s*\.\.\.worksGridStyle,/);
  assert.match(page, /const desktopWorkCardStyle: CSSProperties = \{\s*\.\.\.workCardStyle,/);
  assert.match(page, /const desktopWorkContentStyle: CSSProperties = \{\s*\.\.\.workContentStyle,/);
  assert.match(page, /style=\{isDesktop \? desktopSectionStyle : sectionStyle\}/);
  assert.match(page, /style=\{isDesktop \? desktopWorksGridStyle : worksGridStyle\}/);
  assert.match(page, /style=\{isDesktop \? desktopWorkCardStyle : workCardStyle\}/);
  assert.match(page, /style=\{coverLinkStyle\}/);
  assert.match(page, /style=\{coverGlowStyle\}/);
  assert.match(page, /style=\{statusRowStyle\}/);
  assert.match(page, /style=\{obraComStatusPublicado \? publishedStatusStyle : draftStatusStyle\}/);
  assert.match(page, /style=\{isDesktop \? desktopWorkContentStyle : workContentStyle\}/);
});
