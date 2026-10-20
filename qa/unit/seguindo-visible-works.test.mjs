import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-visible-works.ts", import.meta.url), "utf8");
const helper = readFileSync(new URL("../../app/seguindo/lib/seguindo-visible-works.ts", import.meta.url), "utf8");

test("filtragem de obras preserva exclusão adulta e listas seguidas", () => {
  assert.match(hook, /filtrarObrasVisiveisSeguindo\(obras\)/);
  assert.match(hook, /filtrarObrasSeguidasBase\(obrasVisiveisSeguindo, obrasSeguidas\)/);
  assert.match(hook, /\[obrasVisiveisSeguindo, obrasSeguidas\]/);
  assert.match(helper, /!ehClassificacao18\(obra\.classificacaoIndicativa\)/);
  assert.match(helper, /obraEstaNaLista\(obra, obrasSeguidas\)/);
  assert.match(helper, /import type \{ ObraLocal \}/);
});
