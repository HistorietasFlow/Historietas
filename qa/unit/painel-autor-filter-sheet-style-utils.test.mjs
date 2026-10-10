import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-filter-sheet-style-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);

test("estilos do painel de filtros preservam propriedades e composições", () => {
  for (const name of [
    "filterSheetOverlayStyle",
    "filterSheetStyle",
    "desktopFilterSheetStyle",
    "filterSheetHandleStyle",
    "filterSheetTitleStyle",
    "filterSheetContentStyle",
    "filterSheetSectionLabelStyle",
    "filterSheetClearDividerStyle",
    "filterSheetClearStyle",
  ]) {
    assert.match(source, new RegExp(`export const ${name}: CSSProperties`));
  }

  assert.match(
    source,
    /import \{ safeTextStyle \} from "\.\/painel-autor-desktop-header-style-utils";/,
  );
  assert.match(source, /\.\.\.filterSheetStyle/);
  assert.match(source, /\.\.\.safeTextStyle/);
  assert.match(source, /height: "100dvh"/);
  assert.match(source, /maxHeight: "calc\(100dvh - 116px\)"/);
  assert.match(source, /WebkitOverflowScrolling: "touch"/);
  assert.match(source, /fontWeight: ativo \? 900 : 650/);
  assert.match(
    source,
    /border: ativo\s*\? "2px solid #FFFFFF"\s*: "2\.5px solid rgba\(161,161,170,0\.72\)"/,
  );
  assert.match(
    source,
    /export function criarFilterSheetOptionStyle\(ativo: boolean\): CSSProperties/,
  );
  assert.match(
    source,
    /export function criarFilterSheetRadioStyle\(ativo: boolean\): CSSProperties/,
  );
});

test("página delega estilos do painel mantendo todos os consumidores", () => {
  assert.match(
    page,
    /from "\.\/lib\/painel-autor-filter-sheet-style-utils";/,
  );

  for (const name of [
    "filterSheetOverlayStyle",
    "filterSheetStyle",
    "desktopFilterSheetStyle",
    "filterSheetHandleStyle",
    "filterSheetTitleStyle",
    "filterSheetContentStyle",
    "filterSheetSectionLabelStyle",
    "filterSheetClearDividerStyle",
    "filterSheetClearStyle",
  ]) {
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties`));
  }
  assert.doesNotMatch(
    page,
    /function criarFilterSheetOptionStyle\(ativo: boolean\): CSSProperties/,
  );
  assert.doesNotMatch(
    page,
    /function criarFilterSheetRadioStyle\(ativo: boolean\): CSSProperties/,
  );

  assert.match(page, /style=\{filterSheetOverlayStyle\}/);
  assert.match(
    page,
    /style=\{isDesktop \? desktopFilterSheetStyle : filterSheetStyle\}/,
  );
  assert.match(page, /style=\{filterSheetHandleStyle\}/);
  assert.match(page, /style=\{filterSheetTitleStyle\}/);
  assert.match(page, /style=\{filterSheetContentStyle\}/);
  assert.match(page, /style=\{filterSheetSectionLabelStyle\}/);
  assert.match(page, /style=\{criarFilterSheetOptionStyle\(ativo\)\}/);
  assert.match(page, /style=\{criarFilterSheetRadioStyle\(ativo\)\}/);
  assert.match(page, /style=\{filterSheetClearDividerStyle\}/);
  assert.match(page, /style=\{filterSheetClearStyle\}/);
});
