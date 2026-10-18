import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../app/seguindo/lib/seguindo-header-base-styles.ts", import.meta.url), "utf8");

test("estilos estruturais do cabeçalho permanecem referenciados na página", () => {
  assert.match(page, /from "\.\/lib\/seguindo-header-base-styles";/);
  for (const name of ["seguindoHeaderStyle", "desktopSeguindoHeaderStyle"]) {
    assert.match(styles, new RegExp(`export const ${name}: CSSProperties =`));
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties =`));
  }
  assert.match(styles, /gridTemplateColumns: "minmax\(0, 1fr\) auto"/);
  assert.match(styles, /flexWrap: "nowrap"/);
});
