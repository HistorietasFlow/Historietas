import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const card = readFileSync(new URL("../../app/seguindo/components/seguindo-social-user-card.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../app/seguindo/lib/seguindo-author-card-styles.ts", import.meta.url), "utf8");

test("cards e avatares de autores preservam estilos extraídos", () => {
  assert.match(card, /from "\.\.\/lib\/seguindo-author-card-styles";/);
  for (const name of ["authorCardStyle", "desktopAuthorCardStyle", "authorAvatarStyle"]) {
    assert.match(styles, new RegExp(`export const ${name}: CSSProperties =`));
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties =`));
  }
  assert.match(styles, /\.\.\.authorCardStyle/);
  assert.match(styles, /WebkitTextFillColor: "#FFFFFF"/);
});
