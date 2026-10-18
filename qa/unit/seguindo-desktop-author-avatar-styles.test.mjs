import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../app/seguindo/lib/seguindo-desktop-author-avatar-styles.ts", import.meta.url), "utf8");

test("avatares e cards desktop de autores preservam estilos derivados", () => {
  assert.match(page, /from "\.\/lib\/seguindo-desktop-author-avatar-styles";/);
  for (const name of ["desktopAuthorAvatarStyle", "desktopAuthorFollowedCardStyle", "desktopAuthorFollowedAvatarStyle"]) {
    assert.match(styles, new RegExp(`export const ${name}: CSSProperties =`));
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties =`));
  }
  assert.match(styles, /from "\.\/seguindo-author-card-styles";/);
  assert.equal((styles.match(/\.\.\.authorAvatarStyle/g) ?? []).length, 2);
  assert.match(styles, /\.\.\.desktopAuthorCardStyle/);
});
