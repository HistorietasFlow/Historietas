import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const derived = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-derived-content.ts", import.meta.url), "utf8");
const helper = readFileSync(new URL("../../app/seguindo/lib/seguindo-social-search-eligibility.ts", import.meta.url), "utf8");

test("busca de sugestões preserva condições de ativação", () => {
  assert.match(derived, /buscaSugestoesUsuariosEstaAtiva\(\s*buscaSeguindoAberta,\s*termoBusca,\s*visualizandoListaSocialDoPerfil,\s*abaConteudo,/);
  assert.match(helper, /termoBusca\.length >= 2/);
  assert.match(helper, /!visualizandoListaSocialDoPerfil/);
  assert.match(helper, /abaConteudo === "pessoas" \|\| abaConteudo === "seguidores"/);
  assert.match(helper, /import type \{ AbaConteudoSeguindo \}/);
});
