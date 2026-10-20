import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-work-follow-state.ts", import.meta.url), "utf8");

test("estado de obras e autores seguidos preserva arrays iniciais vazios", () => {
  assert.match(page, /useSeguindoWorkFollowState\(\)/);
  assert.match(hook, /useState<ObraLocal\[\]>\(\[\]\)/);
  assert.match(hook, /useState<string\[\]>\(\[\]\)/);
  assert.match(hook, /autoresSeguidos, setAutoresSeguidos/);
});
