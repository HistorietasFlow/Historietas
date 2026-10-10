import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-desktop-compositions-style-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);

const desktopStyles = [
  "desktopContainerStyle",
  "desktopStatsBoxStyle",
  "desktopStudioControlsStyle",
  "desktopSectionStyle",
  "desktopWorksGridStyle",
  "desktopWorkCardStyle",
  "desktopWorkContentStyle",
  "desktopSheetStatsRowStyle",
  "desktopCardActionsGridStyle",
];

test("composições desktop preservam bases, spreads e propriedades", () => {
  for (const name of desktopStyles) {
    assert.match(source, new RegExp(`export const ${name}: CSSProperties`));
  }

  assert.match(source, /import \{ containerStyle \} from "\.\/painel-autor-layout-style-utils";/);
  assert.match(source, /import \{ statsBoxStyle, studioControlsStyle \} from "\.\/painel-autor-summary-style-utils";/);
  assert.match(source, /import \{ sheetStatsRowStyle \} from "\.\/painel-autor-work-card-stats-style-utils";/);
  assert.match(source, /import \{ actionsGridStyle \} from "\.\/painel-autor-work-actions-style-utils";/);
  assert.match(source, /\.\.\.containerStyle/);
  assert.match(source, /\.\.\.statsBoxStyle/);
  assert.match(source, /\.\.\.studioControlsStyle/);
  assert.match(source, /\.\.\.sectionStyle/);
  assert.match(source, /\.\.\.worksGridStyle/);
  assert.match(source, /\.\.\.workCardStyle/);
  assert.match(source, /\.\.\.workContentStyle/);
  assert.match(source, /\.\.\.sheetStatsRowStyle/);
  assert.match(source, /\.\.\.actionsGridStyle/);
  assert.match(source, /width: "min\(1180px, calc\(100% - 64px\)\)"/);
  assert.match(source, /gridTemplateColumns: "repeat\(8, minmax\(0, 1fr\)\)"/);
  assert.match(source, /gridTemplateColumns: "repeat\(6, minmax\(0, 1fr\)\)"/);
  assert.match(source, /padding: "10px 22px 16px"/);
});

test("página delega composições desktop e mantém os consumidores", () => {
  assert.match(
    page,
    /from "\.\/lib\/painel-autor-desktop-compositions-style-utils";/,
  );

  for (const name of desktopStyles) {
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties`));
  }

  assert.match(page, /style=\{isDesktop \? desktopContainerStyle : containerStyle\}/);
  assert.match(page, /style=\{isDesktop \? desktopStudioControlsStyle : studioControlsStyle\}/);
  assert.match(page, /style=\{isDesktop \? desktopStatsBoxStyle : statsBoxStyle\}/);
  assert.match(page, /style=\{isDesktop \? desktopSectionStyle : sectionStyle\}/);
  assert.match(page, /style=\{isDesktop \? desktopWorksGridStyle : worksGridStyle\}/);
  assert.match(page, /style=\{isDesktop \? desktopWorkCardStyle : workCardStyle\}/);
  assert.match(page, /style=\{isDesktop \? desktopWorkContentStyle : workContentStyle\}/);
  assert.match(page, /style=\{isDesktop \? desktopSheetStatsRowStyle : sheetStatsRowStyle\}/);
  assert.match(page, /style=\{isDesktop \? desktopCardActionsGridStyle : actionsGridStyle\}/);
});
