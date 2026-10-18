import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const helper = readFileSync(new URL("../../app/seguindo/lib/seguindo-filtered-authors.ts", import.meta.url), "utf8");

test("filtro de autores preserva campos, visibilidade e ordenações", () => {
  assert.match(page, /filtrarAutoresSeguindo\(\s*autoresBase, termoBusca, filtro, ordenacao, abaConteudo, visualizandoListaSocialDoPerfil,/);
  assert.match(helper, /visualizandoListaSocialDoPerfil \|\| abaConteudo !== "pessoas"/);
  assert.match(helper, /formatarGeneroSeguindo\(obra\.genero\)/);
  assert.match(helper, /textoAutor\.includes\(termoBusca\)/);
  for (const filtro of ["em-leitura", "favoritas", "concluidas"]) {
    assert.match(helper, new RegExp(`filtro === "${filtro}"`));
  }
  assert.match(helper, /autorB\.progressoMedio - autorA\.progressoMedio/);
  assert.match(helper, /autorB\.totalCapitulos - autorA\.totalCapitulos/);
  assert.match(helper, /autorA\.nome\.localeCompare\(autorB\.nome\)/);
  assert.match(page, /\[autoresBase, termoBusca, filtro, ordenacao, abaConteudo, visualizandoListaSocialDoPerfil\]/);
});
