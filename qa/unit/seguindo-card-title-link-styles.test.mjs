import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../app/seguindo/lib/seguindo-card-title-link-styles.ts", import.meta.url), "utf8");

test("título e link de autor dos cards mantêm estilos extraídos", () => {
  assert.match(page, /from "\.\/lib\/seguindo-card-title-link-styles";/);
  for (const name of ["cardTitleStyle", "authorLinkStyle"]) {
    assert.match(styles, new RegExp(`export const ${name}: CSSProperties =`));
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties =`));
  }
  assert.match(styles, /import \{ safeTextStyle \} from "\.\/seguindo-surface-styles";/);
  assert.equal((styles.match(/\.\.\.safeTextStyle/g) ?? []).length, 2);
  assert.match(styles, /WebkitLineClamp: 2/);
});
