import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-filtered-users.ts", import.meta.url), "utf8");
const helper = readFileSync(new URL("../../app/seguindo/lib/seguindo-filtered-users.ts", import.meta.url), "utf8");

test("filtro de usuários preserva abas, busca, permissões e ordenação", () => {
  assert.match(hook, /filtrarUsuariosSeguindo\(\s*usuariosBaseSocial, termoBusca, filtro, ordenacao, abaConteudo, visualizandoListaSocialDoPerfil,/);
  assert.match(helper, /abaConteudo !== "pessoas"/);
  assert.match(helper, /abaConteudo !== "seguidores"/);
  assert.match(helper, /!visualizandoListaSocialDoPerfil/);
  assert.match(helper, /filtro !== "todos"/);
  assert.match(helper, /filtro !== "usuarios"/);
  assert.match(helper, /usuarioSeguido\.nome, usuarioSeguido\.handle, usuarioSeguido\.bio/);
  assert.match(helper, /usuarioA\.nome\.localeCompare\(usuarioB\.nome\)/);
  assert.match(helper, /new Date\(usuarioA\.criadoEm\)\.getTime\(\)/);
  assert.match(hook, /\[usuariosBaseSocial, termoBusca, filtro, ordenacao, abaConteudo, visualizandoListaSocialDoPerfil\]/);
});
