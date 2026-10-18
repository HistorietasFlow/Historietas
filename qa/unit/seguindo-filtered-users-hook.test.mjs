import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-filtered-users.ts", import.meta.url), "utf8");

test("hook mantém filtros e dependências dos usuários", () => {
  assert.match(page, /useSeguindoFilteredUsers\(\s*usuariosBaseSocial, termoBusca, filtro, ordenacao, abaConteudo, visualizandoListaSocialDoPerfil,/);
  assert.match(hook, /filtrarUsuariosSeguindo\(\s*usuariosBaseSocial, termoBusca, filtro, ordenacao, abaConteudo, visualizandoListaSocialDoPerfil,/);
  assert.match(hook, /\[usuariosBaseSocial, termoBusca, filtro, ordenacao, abaConteudo, visualizandoListaSocialDoPerfil\]/);
  assert.match(hook, /return usuariosFiltrados;/);
});
