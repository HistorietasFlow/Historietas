import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../app/seguindo/lib/seguindo-card-badges-styles.ts", import.meta.url), "utf8");

test("badges e metadados dos cards preservam heranças de estilos", () => {
  assert.match(page, /from "\.\/lib\/seguindo-card-badges-styles";/);
  for (const name of ["badgeRowStyle", "badgeStyleSmall", "classificationBadgeStyle", "readingBadgeStyle", "authorWorksMetaStyle", "authorReadingMetaStyle"]) {
    assert.match(styles, new RegExp(`export const ${name}: CSSProperties =`));
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties =`));
  }
  assert.match(styles, /import \{ genreStyle \} from "\.\/seguindo-card-overlay-styles";/);
  assert.match(styles, /import \{ safeTextStyle \} from "\.\/seguindo-surface-styles";/);
  assert.match(styles, /\.\.\.genreStyle/);
  assert.match(styles, /\.\.\.readingBadgeStyle/);
});
