import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const helper = readFileSync(new URL("../../app/seguindo/lib/seguindo-filtered-users.ts", import.meta.url), "utf8");

test("filtro de usuários preserva abas, busca, permissões e ordenação", () => {
  assert.match(page, /filtrarUsuariosSeguindo\(\s*usuariosBaseSocial, termoBusca, filtro, ordenacao, abaConteudo, visualizandoListaSocialDoPerfil,/);
  assert.match(helper, /abaConteudo !== "pessoas"/);
  assert.match(helper, /abaConteudo !== "seguidores"/);
  assert.match(helper, /!visualizandoListaSocialDoPerfil/);
  assert.match(helper, /filtro !== "todos"/);
  assert.match(helper, /filtro !== "usuarios"/);
  assert.match(helper, /usuarioSeguido\.nome, usuarioSeguido\.handle, usuarioSeguido\.bio/);
  assert.match(helper, /usuarioA\.nome\.localeCompare\(usuarioB\.nome\)/);
  assert.match(helper, /new Date\(usuarioA\.criadoEm\)\.getTime\(\)/);
  assert.match(page, /\[usuariosBaseSocial, termoBusca, filtro, ordenacao, abaConteudo, visualizandoListaSocialDoPerfil\]/);
});
