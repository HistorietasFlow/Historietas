import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../app/seguindo/lib/seguindo-sorting-sheet-base-styles.ts", import.meta.url), "utf8");

test("estilos da camada e folha de ordenação são extraídos", () => {
  assert.match(page, /from "\.\/lib\/seguindo-sorting-sheet-base-styles";/);
  for (const name of ["sortingBackdropStyle", "sortingSheetStyle", "desktopSortingSheetStyle"]) {
    assert.match(styles, new RegExp(`export const ${name}: CSSProperties =`));
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties =`));
  }
  assert.match(styles, /\.\.\.sortingSheetStyle/);
});
