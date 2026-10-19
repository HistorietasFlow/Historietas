import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const header = readFileSync(new URL("../../app/seguindo/components/seguindo-header.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../app/seguindo/lib/seguindo-search-shell-styles.ts", import.meta.url), "utf8");

test("estilos da caixa de busca são extraídos preservando referências", () => {
  assert.match(header, /from "\.\.\/lib\/seguindo-search-shell-styles";/);
  for (const name of ["seguindoHeaderSearchShellStyle", "desktopSeguindoHeaderSearchShellStyle", "seguindoHeaderSearchInputStyle"]) {
    assert.match(styles, new RegExp(`export const ${name}: CSSProperties =`));
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties =`));
  }
  assert.match(styles, /\.\.\.seguindoHeaderSearchShellStyle/);
  assert.match(header, /style=\{desktopSeguindoHeaderSearchShellStyle\}/);
  assert.match(header, /style=\{seguindoHeaderSearchShellStyle\}/);
});
