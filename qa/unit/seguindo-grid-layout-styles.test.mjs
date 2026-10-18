import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../app/seguindo/lib/seguindo-grid-layout-styles.ts", import.meta.url), "utf8");

test("grades de obras e autores preservam os estilos responsivos extraídos", () => {
  assert.match(page, /from "\.\/lib\/seguindo-grid-layout-styles";/);
  for (const name of ["gridStyle", "desktopGridStyle", "authorsGridStyle", "desktopAuthorsGridStyle"]) {
    assert.match(styles, new RegExp(`export const ${name}: CSSProperties =`));
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties =`));
  }
  assert.match(styles, /\.\.\.gridStyle/);
  assert.match(styles, /\.\.\.authorsGridStyle/);
  assert.equal((styles.match(/gridTemplateColumns: "repeat\(2, minmax\(0, 1fr\)\)"/g) ?? []).length, 2);
});
