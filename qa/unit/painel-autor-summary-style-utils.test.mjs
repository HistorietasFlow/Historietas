import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-summary-style-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);

test("estilos do resumo preservam o contrato visual", () => {
  for (const name of [
    "statsBoxStyle",
    "statCardStyle",
    "statNumberStyle",
    "statLabelStyle",
    "studioControlsStyle",
    "studioClearButtonStyle",
  ]) {
    assert.match(source, new RegExp(`export const ${name}: CSSProperties`));
  }

  assert.match(
    source,
    /import \{ safeTextStyle \} from "\.\/painel-autor-desktop-header-style-utils";/,
  );
  assert.match(source, /\.\.\.safeTextStyle/);
  assert.match(source, /display: "flex"/);
  assert.match(source, /flex: "1 1 calc\(25% - 5px\)"/);
  assert.match(source, /background: "rgba\(255,255,255,0\.055\)"/);
});

test("página preserva as composições desktop e consumidores do resumo", () => {
  assert.match(page, /from "\.\/lib\/painel-autor-summary-style-utils";/);
  for (const name of [
    "statsBoxStyle",
    "statCardStyle",
    "statNumberStyle",
    "statLabelStyle",
    "studioControlsStyle",
    "studioClearButtonStyle",
  ]) {
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties`));
    assert.match(page, new RegExp(`\\b${name}\\b`));
  }

  assert.match(
    page,
    /const desktopStatsBoxStyle: CSSProperties = \{\s*\.\.\.statsBoxStyle,/,
  );
  assert.match(
    page,
    /const desktopStudioControlsStyle: CSSProperties = \{\s*\.\.\.studioControlsStyle,/,
  );
  assert.match(page, /style=\{studioClearButtonStyle\}/);
});
