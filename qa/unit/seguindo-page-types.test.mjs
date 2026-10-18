import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const models = readFileSync(new URL("../../app/seguindo/lib/seguindo-page-types.ts", import.meta.url), "utf8");

test("tipos de Seguindo vivem no módulo dedicado sem lógica de execução", () => {
  assert.match(page, /from "\.\/lib\/seguindo-page-types";/);
  for (const name of ["CapituloLocal", "ObraLocal", "AutorSeguido", "UsuarioSeguido", "SolicitacaoSeguidor", "AtividadeSeguindo", "FiltroSeguindo", "AbaSeguimentoPagina", "OrdenacaoSeguindo", "AbaConteudoSeguindo"]) {
    assert.match(models, new RegExp(`export type ${name} =`));
    assert.doesNotMatch(page, new RegExp(`^type ${name} =`, "m"));
  }
  assert.match(models, /capitulos: CapituloLocal\[\]/);
  assert.match(models, /usuario: UsuarioSeguido/);
  assert.doesNotMatch(models, /\b(?:function|useState|useEffect)\s*\(/);
});
