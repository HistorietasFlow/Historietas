import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);
const hook = readFileSync(
  new URL("../../app/seguindo/hooks/use-seguindo-work-follow-state.ts", import.meta.url),
  "utf8",
);

test("estado de obras e seguimentos preserva arrays iniciais e setters", () => {
  assert.match(
    page,
    /import \{ useSeguindoPageDataState \} from "\.\/hooks\/use-seguindo-page-data-state";/,
  );
  assert.match(page, /\} = useSeguindoPageDataState\(\);/);
  assert.match(hook, /^"use client";/);
  assert.match(hook, /useState<ObraLocal\[\]>\(\[\]\)/);
  assert.match(hook, /useState<string\[\]>\(\[\]\)/);
  for (const value of [
    "setObras",
    "setObrasSeguidas",
    "setAutoresSeguidos",
  ]) {
    assert.match(hook, new RegExp(value));
  }
  assert.doesNotMatch(hook, /supabase|localStorage|useEffect|fetch\(/);
});
