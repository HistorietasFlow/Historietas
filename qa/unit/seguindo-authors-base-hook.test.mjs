import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-authors-base.ts", import.meta.url), "utf8");

test("hook mantém dependências de memoização dos autores base", () => {
  assert.match(page, /useSeguindoAuthorsBase\(\s*obrasVisiveisSeguindo, autoresSeguidos, obrasFavoritas, obrasConcluidas,/);
  assert.match(hook, /montarAutoresBaseSeguindo\(\s*obrasVisiveisSeguindo,\s*autoresSeguidos,\s*obrasFavoritas,\s*obrasConcluidas,/);
  assert.match(hook, /\[obrasVisiveisSeguindo, autoresSeguidos, obrasFavoritas, obrasConcluidas\]/);
  assert.match(hook, /return autoresBase;/);
});
