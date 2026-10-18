import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const helper = readFileSync(new URL("../../app/seguindo/lib/seguindo-social-search-eligibility.ts", import.meta.url), "utf8");

test("busca de sugestões preserva condições de ativação", () => {
  assert.match(page, /buscaSugestoesUsuariosEstaAtiva\(\s*buscaSeguindoAberta,\s*termoBusca,\s*visualizandoListaSocialDoPerfil,\s*abaConteudo,/);
  assert.match(helper, /termoBusca\.length >= 2/);
  assert.match(helper, /!visualizandoListaSocialDoPerfil/);
  assert.match(helper, /abaConteudo === "pessoas" \|\| abaConteudo === "seguidores"/);
  assert.match(helper, /import type \{ AbaConteudoSeguindo \}/);
});
