import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../app/seguindo/lib/seguindo-card-overlay-styles.ts", import.meta.url), "utf8");

test("estilos de sobreposição e conteúdo dos cards preservados", () => {
  assert.match(page, /from "\.\/lib\/seguindo-card-overlay-styles";/);
  for (const name of ["overlayStyle", "genreStyle", "contentStyle", "desktopContentStyle"]) {
    assert.match(styles, new RegExp(`export const ${name}: CSSProperties =`));
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties =`));
  }
  assert.match(styles, /import \{ safeTextStyle \} from "\.\/seguindo-surface-styles";/);
  assert.match(styles, /\.\.\.safeTextStyle/);
  assert.match(styles, /\.\.\.contentStyle/);
});
