import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const header = readFileSync(new URL("../../app/seguindo/components/seguindo-header.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../app/seguindo/lib/seguindo-header-search-styles.ts", import.meta.url), "utf8");

test("estilos da busca do cabeçalho estão no módulo dedicado", () => {
  assert.match(header, /from "\.\.\/lib\/seguindo-header-search-styles";/);
  for (const name of ["desktopSeguindoHeaderSearchIconStyle", "desktopSeguindoHeaderSearchInputStyle"]) {
    assert.match(styles, new RegExp(`export const ${name}: CSSProperties =`));
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties =`));
  }
  assert.match(styles, /transform: "translateY\(-50%\)"/);
  assert.match(styles, /WebkitAppearance: "none"/);
  assert.match(styles, /fontFamily: "inherit"/);
  assert.match(header, /autoComplete="off"/);
  assert.match(header, /maxLength=\{90\}/);
  assert.match(header, /autoFocus/);
});
