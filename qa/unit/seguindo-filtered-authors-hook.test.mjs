import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const derived = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-derived-content.ts", import.meta.url), "utf8");
const hook = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-filtered-authors.ts", import.meta.url), "utf8");

test("hook mantém filtros e dependências dos autores", () => {
  assert.match(page, /useSeguindoDerivedContent\(/);
  assert.match(derived, /useSeguindoFilteredAuthors\(\s*autoresBase,\s*termoBusca,\s*filtro,\s*ordenacao,\s*abaConteudo,\s*visualizandoListaSocialDoPerfil,/);
  assert.match(hook, /filtrarAutoresSeguindo\(\s*autoresBase, termoBusca, filtro, ordenacao, abaConteudo, visualizandoListaSocialDoPerfil,/);
  assert.match(hook, /\[autoresBase, termoBusca, filtro, ordenacao, abaConteudo, visualizandoListaSocialDoPerfil\]/);
  assert.match(hook, /return autoresFiltrados;/);
});
