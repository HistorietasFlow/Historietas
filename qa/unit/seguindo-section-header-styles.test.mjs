import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const sections = readFileSync(new URL("../../app/seguindo/components/seguindo-people-sections.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../app/seguindo/lib/seguindo-section-header-styles.ts", import.meta.url), "utf8");

test("estilos estruturais das seções são extraídos sem perder dependências", () => {
  assert.match(sections, /from "\.\.\/lib\/seguindo-section-header-styles";/);
  for (const name of ["sectionStyle", "desktopSectionStyle", "sectionHeaderStyle", "desktopSectionHeaderStyle", "sectionHeaderTextStyle", "sectionTitleStyle", "sectionCounterStyle"]) {
    assert.match(styles, new RegExp(`export const ${name}: CSSProperties =`));
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties =`));
  }
  assert.match(styles, /import \{ safeTextStyle \} from "\.\/seguindo-surface-styles";/);
  assert.match(styles, /\.\.\.safeTextStyle/);
  assert.match(styles, /\.\.\.sectionStyle/);
  assert.match(styles, /\.\.\.sectionHeaderStyle/);
});
