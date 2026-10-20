import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const loadedState = readFileSync(new URL("../../app/seguindo/components/seguindo-page-loaded-state.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../app/seguindo/lib/seguindo-layout-styles.ts", import.meta.url), "utf8");

test("layout é extraído sem mudar referências na página", () => {
  assert.match(loadedState, /from "\.\.\/lib\/seguindo-layout-styles";/);
  for (const name of ["pageStyle", "containerStyle", "desktopContainerStyle"]) {
    assert.match(styles, new RegExp(`export const ${name}: CSSProperties =`));
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties =`));
  }
  assert.match(styles, /\.\.\.containerStyle/);
  assert.match(styles, /--historietas-seguindo-bg-page/);
  assert.match(styles, /safe-area-inset-bottom/);
});
