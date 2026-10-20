import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-page-load-state.ts", import.meta.url), "utf8");

test("carregamento e atividades preservam estados iniciais", () => {
  assert.match(page, /useSeguindoPageLoadState\(\)/);
  assert.match(hook, /useState<AtividadeSeguindo\[\]>\(\[\]\)/);
  assert.match(hook, /useState\(true\)/);
  assert.match(hook, /setAtividadesSeguindo, carregando, setCarregando/);
});
