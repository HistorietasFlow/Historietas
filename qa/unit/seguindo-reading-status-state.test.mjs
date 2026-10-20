import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-reading-status-state.ts", import.meta.url), "utf8");

test("favoritos e obras concluídas mantêm arrays iniciais vazios e setters", () => {
  assert.match(page, /useSeguindoPageDataState\(\)/);
  assert.match(hook, /const \[obrasFavoritas, setObrasFavoritas\] = useState<string\[\]>\(\[\]\)/);
  assert.match(hook, /const \[obrasConcluidas, setObrasConcluidas\] = useState<string\[\]>\(\[\]\)/);
  assert.match(hook, /return \{ obrasFavoritas, setObrasFavoritas, obrasConcluidas, setObrasConcluidas \}/);
});
