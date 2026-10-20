import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-sorting-panel-state.ts", import.meta.url), "utf8");

test("painel de ordenação mantém estado fechado e setter", () => {
  assert.match(page, /useSeguindoPageState\(\)/);
  assert.match(hook, /const \[mostrarPainelOrdenacao, setMostrarPainelOrdenacao\] = useState\(false\)/);
  assert.match(hook, /return \{ mostrarPainelOrdenacao, setMostrarPainelOrdenacao \}/);
  assert.match(page, /useSeguindoPageContext\(\s*mostrarPainelOrdenacao,?\s*\)/);
});
