import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-search-state.ts", import.meta.url), "utf8");

test("busca preserva estado inicial e setters", () => {
  assert.match(page, /useSeguindoPageDiscoveryState\(\)/);
  assert.match(hook, /const \[busca, setBusca\] = useState\(""\)/);
  assert.match(hook, /const \[buscaSeguindoAberta, setBuscaSeguindoAberta\] = useState\(false\)/);
  assert.match(hook, /return \{ busca, setBusca, buscaSeguindoAberta, setBuscaSeguindoAberta \}/);
});
