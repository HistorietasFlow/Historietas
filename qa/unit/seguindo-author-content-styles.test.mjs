import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../app/seguindo/lib/seguindo-author-content-styles.ts", import.meta.url), "utf8");

test("estilos de conteúdo e ações dos autores preservam referências", () => {
  assert.match(page, /from "\.\/lib\/seguindo-author-content-styles";/);
  for (const name of ["authorContentStyle", "authorBadgeRowStyle", "authorActionsGridStyle", "desktopAuthorActionsGridStyle"]) {
    assert.match(styles, new RegExp(`export const ${name}: CSSProperties =`));
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties =`));
  }
  assert.match(styles, /\.\.\.authorActionsGridStyle/);
  assert.match(styles, /gridTemplateColumns: "repeat\(2, minmax\(0, 1fr\)\)"/);
});
