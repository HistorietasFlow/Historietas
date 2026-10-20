import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const toolbar = readFileSync(new URL("../../app/seguindo/components/seguindo-social-toolbar.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../app/seguindo/lib/seguindo-desktop-social-section-styles.ts", import.meta.url), "utf8");

test("estilos de abas e seções desktop preservam herança", () => {
  assert.match(toolbar, /from "\.\.\/lib\/seguindo-desktop-social-section-styles";/);
  for (const name of ["desktopSocialTabsStyle","desktopSocialTabStyle","desktopSocialTabActiveStyle","desktopSectionHeaderTextStyle","desktopSectionTitleStyle","desktopSectionCounterStyle"]) {
    assert.match(styles, new RegExp(`export const ${name}: CSSProperties =`));
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties =`));
  }
  assert.match(styles, /from "\.\/seguindo-social-toolbar-styles";/);
  assert.match(styles, /from "\.\/seguindo-section-header-styles";/);
  assert.match(styles, /\.\.\.desktopSocialTabStyle/);
  assert.match(styles, /\.\.\.sectionTitleStyle/);
});
