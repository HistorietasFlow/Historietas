import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../app/seguindo/lib/seguindo-card-base-styles.ts", import.meta.url), "utf8");

test("cards e capas preservam estilos desktop e mobile após extração", () => {
  assert.match(page, /from "\.\/lib\/seguindo-card-base-styles";/);
  for (const name of ["cardStyle", "desktopCardStyle", "coverStyle", "desktopCoverStyle"]) {
    assert.match(styles, new RegExp(`export const ${name}: CSSProperties =`));
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties =`));
  }
  assert.match(styles, /\.\.\.cardStyle/);
  assert.match(styles, /\.\.\.coverStyle/);
  assert.match(styles, /--historietas-seguindo-panel/);
});
