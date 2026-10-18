import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../app/seguindo/lib/seguindo-header-icon-style.ts", import.meta.url), "utf8");

test("ícone de filtro mantém estilo após extração", () => {
  assert.match(page, /import \{ seguindoHeaderFilterIconStyle \} from "\.\/lib\/seguindo-header-icon-style";/);
  assert.doesNotMatch(page, /const seguindoHeaderFilterIconStyle: CSSProperties =/);
  assert.match(styles, /export const seguindoHeaderFilterIconStyle: CSSProperties =/);
  assert.match(styles, /fontSize: "21px"/);
  assert.match(styles, /flex: "0 0 auto"/);
});
