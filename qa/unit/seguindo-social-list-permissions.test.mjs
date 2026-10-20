import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const derived = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-derived-content.ts", import.meta.url), "utf8");
const helper = readFileSync(new URL("../../app/seguindo/lib/seguindo-social-list-permissions.ts", import.meta.url), "utf8");

test("permissões de remoção continuam restritas ao proprietário e à aba", () => {
  assert.match(derived, /obterPermissoesListaSocial\(listaSocialEhDoUsuarioLogado, abaConteudo\)/);
  assert.match(helper, /listaSocialEhDoUsuarioLogado && abaConteudo === "pessoas"/);
  assert.match(helper, /listaSocialEhDoUsuarioLogado && abaConteudo === "seguidores"/);
  assert.match(helper, /import type \{ AbaConteudoSeguindo \}/);
  assert.doesNotMatch(derived, /const podeRemoverUsuariosDaLista\s*=/);
});
