import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const derived = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-derived-content.ts", import.meta.url), "utf8");
const labels = readFileSync(new URL("../../app/seguindo/lib/seguindo-social-list-labels.ts", import.meta.url), "utf8");

test("rótulos da lista social são delegados ao helper tipado", () => {
  assert.match(derived, /obterRotulosListaSocial\(\s*abaConteudo,\s*perfilSocialNome,/);
  assert.match(labels, /import type \{ AbaConteudoSeguindo \} from "\.\/seguindo-page-types"/);
  assert.match(labels, /abaConteudo === "seguidores"/);
  assert.match(labels, /"PESSOAS SEGUIDAS"/);
  assert.match(labels, /"OBRAS SEGUIDAS"/);
  assert.match(labels, /perfilSocialNome\.trim\(\)/);
  assert.match(labels, /return \{ tituloListaSocial, descricaoListaSocial \}/);
  assert.doesNotMatch(derived, /const tituloListaSocial\s*=\s*\n\s*abaConteudo ===/);
});
