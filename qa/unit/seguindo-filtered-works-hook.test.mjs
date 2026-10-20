import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const derived = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-derived-content.ts", import.meta.url), "utf8");
const hook = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-filtered-works.ts", import.meta.url), "utf8");

test("hook preserva argumentos e dependências das obras filtradas", () => {
  assert.match(page, /useSeguindoDerivedContent\(/);
  assert.match(derived, /useSeguindoFilteredWorks\(\s*obrasSeguidasBase,\s*termoBusca,\s*filtro,\s*ordenacao,\s*obrasFavoritas,\s*obrasConcluidas,\s*abaConteudo,/);
  assert.match(hook, /filtrarObrasSeguindo\(\s*obrasSeguidasBase,\s*termoBusca,\s*filtro,\s*ordenacao,\s*obrasFavoritas,\s*obrasConcluidas,\s*abaConteudo,/);
  assert.match(hook, /\[obrasSeguidasBase, termoBusca, filtro, ordenacao, obrasFavoritas, obrasConcluidas, abaConteudo\]/);
  assert.match(hook, /return obrasFiltradas;/);
});
