import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const derived = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-derived-content.ts", import.meta.url), "utf8");
const helper = readFileSync(new URL("../../app/seguindo/lib/seguindo-social-users-selector.ts", import.meta.url), "utf8");

test("seleção da lista social preserva seguidores versus seguindo", () => {
  assert.match(derived, /selecionarUsuariosBaseSocial\(\s*abaConteudo,\s*usuariosSeguidores,\s*usuariosSeguidos,/);
  assert.match(helper, /abaConteudo === "seguidores" \? usuariosSeguidores : usuariosSeguidos/);
  assert.match(helper, /import type \{ AbaConteudoSeguindo, UsuarioSeguido \}/);
  assert.doesNotMatch(derived, /abaConteudo === "seguidores" \? usuariosSeguidores : usuariosSeguidos/);
});
