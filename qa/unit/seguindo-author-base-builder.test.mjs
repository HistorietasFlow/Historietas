import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const helper = readFileSync(new URL("../../app/seguindo/lib/seguindo-author-base-builder.ts", import.meta.url), "utf8");

test("montagem de autores conserva métricas, ordenação e dependências", () => {
  assert.match(page, /montarAutoresBaseSeguindo\(\s*obrasVisiveisSeguindo,\s*autoresSeguidos,\s*obrasFavoritas,\s*obrasConcluidas,/);
  assert.match(page, /\[obrasVisiveisSeguindo, autoresSeguidos, obrasFavoritas, obrasConcluidas\]/);
  assert.match(helper, /normalizarNomeAutor\(nomeAutor\)/);
  assert.match(helper, /obterTotalCurtidasObraSeguindo\(obra\)/);
  assert.match(helper, /calcularProgressoLeitura\(obra\.capitulos\)/);
  assert.match(helper, /obraEstaNaLista\(obra, obrasConcluidas\)/);
  assert.match(helper, /localeCompare\(autorB\.nome\)/);
  assert.doesNotMatch(page, /const mapa = new Map<string, \{ nome: string; obras: ObraLocal\[\] \}>/);
});
