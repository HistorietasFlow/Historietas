import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../app/seguindo/lib/seguindo-social-toolbar-styles.ts", import.meta.url), "utf8");

test("estilos de barra e abas sociais foram extraídos", () => {
  assert.match(page, /from "\.\/lib\/seguindo-social-toolbar-styles";/);
  for (const name of ["socialToolbarStyle", "desktopSocialToolbarStyle", "socialTabsStyle", "socialTabStyle", "socialTabActiveStyle", "mobileThreeSocialTabStyle", "socialTabCountStyle", "mobileThreeSocialTabCountStyle"]) {
    assert.match(styles, new RegExp(`export const ${name}: CSSProperties =`));
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties =`));
  }
  assert.match(styles, /\.\.\.socialToolbarStyle/);
  assert.match(styles, /\.\.\.socialTabStyle/);
  assert.match(styles, /\.\.\.socialTabCountStyle/);
});
