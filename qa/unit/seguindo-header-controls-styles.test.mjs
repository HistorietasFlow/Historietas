import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../app/seguindo/lib/seguindo-header-controls-styles.ts", import.meta.url), "utf8");

test("controles do cabeçalho usam estilos extraídos", () => {
  assert.match(page, /from "\.\/lib\/seguindo-header-controls-styles";/);
  for (const name of ["seguindoSearchToggleStyle", "seguindoHeaderFilterButtonStyle", "desktopSeguindoHeaderFilterButtonStyle"]) {
    assert.match(styles, new RegExp(`export const ${name}: CSSProperties =`));
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties =`));
  }
  assert.match(styles, /import \{ safeTextStyle \} from "\.\/seguindo-surface-styles";/);
  assert.match(styles, /\.\.\.safeTextStyle/);
  assert.match(styles, /WebkitTapHighlightColor: "transparent"/);
});
