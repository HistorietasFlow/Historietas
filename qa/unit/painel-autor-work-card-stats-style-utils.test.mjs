import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-work-card-stats-style-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);

test("estilos de métricas dos cards preservam o contrato visual", () => {
  for (const name of [
    "sheetStatsRowStyle",
    "sheetStatInlineStyle",
    "sheetStatIconStyle",
    "sheetStatHeartIconStyle",
    "sheetStatValueStyle",
  ]) {
    assert.match(source, new RegExp(`export const ${name}: CSSProperties`));
  }

  assert.match(
    source,
    /import \{ safeTextStyle \} from "\.\/painel-autor-desktop-header-style-utils";/,
  );
  assert.match(source, /padding: "8px 22px 14px"/);
  assert.match(source, /gap: "4px"/);
  assert.match(source, /fontSize: "14px"/);
  assert.match(source, /\.\.\.sheetStatIconStyle/);
  assert.match(source, /var\(--historietas-painel-heart-icon, #F43F5E\)/);
  assert.match(source, /\.\.\.safeTextStyle/);
});

test("página delega métricas e preserva a composição desktop", () => {
  assert.match(
    page,
    /from "\.\/lib\/painel-autor-work-card-stats-style-utils";/,
  );

  for (const name of [
    "sheetStatsRowStyle",
    "sheetStatInlineStyle",
    "sheetStatIconStyle",
    "sheetStatHeartIconStyle",
    "sheetStatValueStyle",
  ]) {
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties`));
  }

  assert.match(
    page,
    /const desktopSheetStatsRowStyle: CSSProperties = \{\s*\.\.\.sheetStatsRowStyle,/,
  );
  assert.match(
    page,
    /style=\{isDesktop \? desktopSheetStatsRowStyle : sheetStatsRowStyle\}/,
  );
  assert.equal((page.match(/style=\{sheetStatInlineStyle\}/g) || []).length, 5);
  assert.equal((page.match(/style=\{sheetStatIconStyle\}/g) || []).length, 4);
  assert.equal((page.match(/style=\{sheetStatHeartIconStyle\}/g) || []).length, 1);
  assert.equal((page.match(/style=\{sheetStatValueStyle\}/g) || []).length, 5);
});
