import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const helper = readFileSync(new URL("../../app/seguindo/lib/seguindo-visible-works.ts", import.meta.url), "utf8");

test("filtragem de obras preserva exclusão adulta e listas seguidas", () => {
  assert.match(page, /filtrarObrasVisiveisSeguindo\(obras\)/);
  assert.match(page, /filtrarObrasSeguidasBase\(obrasVisiveisSeguindo, obrasSeguidas\)/);
  assert.match(page, /\[obrasVisiveisSeguindo, obrasSeguidas\]/);
  assert.match(helper, /!ehClassificacao18\(obra\.classificacaoIndicativa\)/);
  assert.match(helper, /obraEstaNaLista\(obra, obrasSeguidas\)/);
  assert.match(helper, /import type \{ ObraLocal \}/);
});
