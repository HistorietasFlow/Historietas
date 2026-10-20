import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const derived = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-derived-content.ts", import.meta.url), "utf8");
const helper = readFileSync(new URL("../../app/seguindo/lib/seguindo-filtered-works.ts", import.meta.url), "utf8");

test("filtragem e ordenação preservam critérios e dependências", () => {
  assert.match(page, /useSeguindoDerivedContent\(/);
  assert.match(derived, /useSeguindoFilteredWorks\(\s*obrasSeguidasBase,\s*termoBusca,\s*filtro,\s*ordenacao,\s*obrasFavoritas,\s*obrasConcluidas,\s*abaConteudo,/);
  assert.match(helper, /abaConteudo !== "obras"/);
  assert.match(helper, /filtro === "autores" \|\| filtro === "usuarios"/);
  assert.match(helper, /textoBuscaObra\(obra\)\.includes\(termoBusca\)/);
  assert.match(helper, /obraEstaNaLista\(obra, obrasFavoritas\)/);
  assert.match(helper, /obraEstaNaLista\(obra, obrasConcluidas\)/);
  for (const sort of ["titulo", "progresso", "capitulos", "antigos"]) {
    assert.match(helper, new RegExp(`ordenacao === "${sort}"`));
  }
  assert.match(derived, /useSeguindoFilteredWorks\(/);
});
