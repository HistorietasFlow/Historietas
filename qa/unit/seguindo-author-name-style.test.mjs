import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const card = readFileSync(new URL("../../app/seguindo/components/seguindo-social-user-card.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../app/seguindo/lib/seguindo-author-name-style.ts", import.meta.url), "utf8");

test("estilo do nome de autor preserva a dependência de texto seguro", () => {
  assert.match(card, /import \{ authorNameStyle \} from "\.\.\/lib\/seguindo-author-name-style";/);
  assert.doesNotMatch(page, /const authorNameStyle: CSSProperties =/);
  assert.match(styles, /export const authorNameStyle: CSSProperties =/);
  assert.match(styles, /import \{ safeTextStyle \} from "\.\/seguindo-surface-styles";/);
  assert.match(styles, /\.\.\.safeTextStyle/);
});
