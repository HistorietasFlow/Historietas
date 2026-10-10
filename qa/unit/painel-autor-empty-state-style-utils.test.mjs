import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-empty-state-style-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);

const emptyStateStyles = [
  "emptyMiniBoxStyle",
  "emptyMiniTitleStyle",
  "emptyMiniTextStyle",
  "emptyMiniButtonStyle",
];

test("estilos do estado vazio preservam propriedades, gradiente e texto seguro", () => {
  for (const name of emptyStateStyles) {
    assert.match(source, new RegExp(`export const ${name}: CSSProperties`));
  }

  assert.match(
    source,
    /import \{ safeTextStyle \} from "\.\/painel-autor-desktop-header-style-utils";/,
  );
  assert.match(
    source,
    /const themeGradient = "linear-gradient\(90deg, var\(--historietas-accent, #FFFFFF\) 0%, var\(--historietas-secondary, #A1A1AA\) 100%\)";/,
  );
  assert.doesNotMatch(source, /export const themeGradient/);
  assert.match(source, /borderRadius: "20px"/);
  assert.match(source, /boxShadow: "none"/);
  assert.match(source, /letterSpacing: "-0\.035em"/);
  assert.match(source, /\.\.\.safeTextStyle/);
  assert.match(source, /background: themeGradient/);
  assert.match(source, /minHeight: "34px"/);
});

test("página delega estado vazio e mantém os consumidores", () => {
  assert.match(
    page,
    /from "\.\/lib\/painel-autor-empty-state-style-utils";/,
  );

  for (const name of emptyStateStyles) {
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties`));
    assert.match(page, new RegExp(`style=\\{${name}\\}`));
  }

  assert.doesNotMatch(page, /const themeGradient =/);
  assert.match(page, /onClick=\{limparFiltros\} style=\{emptyMiniButtonStyle\}/);
});
