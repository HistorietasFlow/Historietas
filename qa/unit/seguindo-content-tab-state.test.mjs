import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-content-tab-state.ts", import.meta.url), "utf8");

test("aba de conteúdo mantém valor inicial e setter", () => {
  assert.match(page, /useSeguindoPageState\(\)/);
  assert.match(hook, /useState<AbaConteudoSeguindo>\("obras"\)/);
  assert.match(hook, /return \{ abaConteudo, setAbaConteudo \}/);
});
