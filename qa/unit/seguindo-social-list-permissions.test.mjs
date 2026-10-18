import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const helper = readFileSync(new URL("../../app/seguindo/lib/seguindo-social-list-permissions.ts", import.meta.url), "utf8");

test("permissões de remoção continuam restritas ao proprietário e à aba", () => {
  assert.match(page, /obterPermissoesListaSocial\(listaSocialEhDoUsuarioLogado, abaConteudo\)/);
  assert.match(helper, /listaSocialEhDoUsuarioLogado && abaConteudo === "pessoas"/);
  assert.match(helper, /listaSocialEhDoUsuarioLogado && abaConteudo === "seguidores"/);
  assert.match(helper, /import type \{ AbaConteudoSeguindo \}/);
  assert.doesNotMatch(page, /const podeRemoverUsuariosDaLista\s*=/);
});
