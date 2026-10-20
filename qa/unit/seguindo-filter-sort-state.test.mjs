import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-filter-sort-state.ts", import.meta.url), "utf8");

test("filtros e ordenação preservam estados iniciais e setters", () => {
  assert.match(page, /useSeguindoPageState\(\)/);
  assert.match(hook, /useState<FiltroSeguindo>\("todos"\)/);
  assert.match(hook, /useState<OrdenacaoSeguindo>\("padrao"\)/);
  assert.match(hook, /return \{ filtro, setFiltro, ordenacao, setOrdenacao \}/);
});
