import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const helper = readFileSync(new URL("../../app/seguindo/lib/seguindo-social-users-selector.ts", import.meta.url), "utf8");

test("seleção da lista social preserva seguidores versus seguindo", () => {
  assert.match(page, /selecionarUsuariosBaseSocial\(\s*abaConteudo,\s*usuariosSeguidores,\s*usuariosSeguidos,/);
  assert.match(helper, /abaConteudo === "seguidores" \? usuariosSeguidores : usuariosSeguidos/);
  assert.match(helper, /import type \{ AbaConteudoSeguindo, UsuarioSeguido \}/);
  assert.doesNotMatch(page, /abaConteudo === "seguidores" \? usuariosSeguidores : usuariosSeguidos/);
});
