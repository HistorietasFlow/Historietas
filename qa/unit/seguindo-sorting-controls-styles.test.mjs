import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const panel = readFileSync(new URL("../../app/seguindo/components/seguindo-sorting-panel.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../app/seguindo/lib/seguindo-sorting-controls-styles.ts", import.meta.url), "utf8");

test("estilos dos controles de ordenação mantêm as referências", () => {
  assert.match(panel, /from "\.\.\/lib\/seguindo-sorting-controls-styles";/);
  for (const name of ["sortingHandleStyle", "sortingTitleStyle", "sortingOptionsListStyle", "sortingOptionStyle", "sortingOptionActiveStyle", "sortingOptionRadioStyle", "sortingOptionRadioActiveStyle"]) {
    assert.match(styles, new RegExp(`export const ${name}: CSSProperties =`));
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties =`));
    assert.match(panel, new RegExp(`\\b${name}\\b`));
  }
  assert.match(styles, /import \{ safeTextStyle \} from "\.\/seguindo-surface-styles";/);
  assert.match(styles, /\.\.\.safeTextStyle/);
  assert.match(styles, /\.\.\.sortingOptionStyle/);
  assert.match(styles, /\.\.\.sortingOptionRadioStyle/);
});
