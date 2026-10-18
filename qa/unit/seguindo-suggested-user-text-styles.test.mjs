import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../app/seguindo/lib/seguindo-suggested-user-text-styles.ts", import.meta.url), "utf8");

test("estilos de textos e carregamento de usuários sugeridos são extraídos", () => {
  assert.match(page, /from "\.\/lib\/seguindo-suggested-user-text-styles";/);
  for (const name of ["suggestedUsersLoadingStyle", "suggestedUserInfoStyle", "suggestedUserNameStyle", "suggestedUserHandleStyle"]) {
    assert.match(styles, new RegExp(`export const ${name}: CSSProperties =`));
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties =`));
  }
  assert.match(styles, /textOverflow: "ellipsis"/);
  assert.match(styles, /--historietas-text-secondary/);
});
