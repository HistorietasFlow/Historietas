import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const styles = readFileSync(
  new URL("../../app/seguindo/lib/seguindo-surface-styles.ts", import.meta.url),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);
const frame = readFileSync(
  new URL("../../app/seguindo/components/seguindo-page-frame.tsx", import.meta.url),
  "utf8",
);

test("estilos de superfície são definidos apenas no módulo extraído", () => {
  for (const name of [
    "safeTextStyle",
    "mobileTopWaterFadeStyle",
    "desktopTopWaterFadeStyle",
  ]) {
    assert.match(styles, new RegExp(`export const ${name}: CSSProperties =`));
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties =`));
    if (name !== "safeTextStyle") {
      assert.match(frame, new RegExp(`\\b${name}\\b`));
    }
  }
  assert.match(frame, /from "\.\.\/lib\/seguindo-surface-styles";/);
});

test("mantém propriedades de fade sem efeito visual", () => {
  assert.equal((styles.match(/pointerEvents: "none"/g) ?? []).length, 2);
  assert.equal((styles.match(/opacity: 0/g) ?? []).length, 2);
  assert.equal((styles.match(/maskImage: "none"/g) ?? []).length, 2);
  assert.match(styles, /overflowWrap: "anywhere"/);
  assert.match(styles, /wordBreak: "break-word"/);
});
