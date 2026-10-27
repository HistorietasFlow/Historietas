import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync("app/admin/exclusoes-conta/page.tsx", "utf8");
const stylesSource = readFileSync(
  "app/admin/exclusoes-conta/lib/admin-exclusoes-conta-styles.ts",
  "utf8",
);

const estilosExportados = [
  "adminExclusoesCss", "recoverySectionStyle", "recoveryCardStyle", "pageStyle",
  "containerStyle", "filtersStyle", "cardStyle", "fieldControlStyle", "textareaStyle", "unsavedStyle",
];

test("Admin Exclusões concentra CSS e estilos estáticos em módulo dedicado", () => {
  assert.match(stylesSource, /import type \{ CSSProperties \} from "react";/);
  assert.equal(
    (stylesSource.match(/^export const [A-Za-z][A-Za-z0-9]*Style: CSSProperties =/gm) || []).length,
    63,
  );
  estilosExportados.forEach((nome) => assert.match(stylesSource, new RegExp(`export const ${nome}`)));
  assert.match(stylesSource, /@media \(max-width: 760px\)/);
  assert.match(stylesSource, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(stylesSource, /\.\.\.badgeStyle/);
  assert.match(stylesSource, /background: "var\(--historietas-page-background, #070212\)"/);
});

test("Admin Exclusões preserva a composição visual na página", () => {
  assert.doesNotMatch(pageSource, /const [A-Za-z][A-Za-z0-9]*Style: CSSProperties =/);
  assert.doesNotMatch(pageSource, /const adminExclusoesCss =/);
  assert.match(pageSource, /from "\.\/lib\/admin-exclusoes-conta-styles";/);
  assert.match(pageSource, /useHistorietasTheme\(pageStyle\)/);
  assert.match(pageSource, /<style>\{`\$\{historietasThemeCss\}\$\{adminExclusoesCss\}`\}<\/style>/);
  estilosExportados.slice(1).forEach((nome) => assert.match(pageSource, new RegExp(`\\b${nome}\\b`)));
  assert.doesNotMatch(
    stylesSource,
    /useState|useEffect|fetch\(|supabase|localStorage|router|<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
  );
});
