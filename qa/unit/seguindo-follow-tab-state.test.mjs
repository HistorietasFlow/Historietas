import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-follow-tab-state.ts", import.meta.url), "utf8");

test("aba de seguimento mantém estado inicial e setter", () => {
  assert.match(page, /\} = useSeguindoPageAccessContextState\(\)/);
  assert.match(hook, /useState<AbaSeguimentoPagina>\("seguindo"\)/);
  assert.match(hook, /return \{ setAbaSeguimento \}/);
});
