import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-visible-works.ts", import.meta.url), "utf8");

test("hook preserva memoização das obras visíveis e seguidas", () => {
  assert.match(page, /useSeguindoVisibleWorks\(obras, obrasSeguidas\)/);
  assert.match(hook, /^"use client";/);
  assert.match(hook, /filtrarObrasVisiveisSeguindo\(obras\)/);
  assert.match(hook, /\[obras\]/);
  assert.match(hook, /filtrarObrasSeguidasBase\(obrasVisiveisSeguindo, obrasSeguidas\)/);
  assert.match(hook, /\[obrasVisiveisSeguindo, obrasSeguidas\]/);
  assert.match(hook, /return \{ obrasVisiveisSeguindo, obrasSeguidasBase \}/);
});
