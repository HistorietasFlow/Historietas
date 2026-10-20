import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-social-list-state.ts", import.meta.url), "utf8");

test("listas sociais preservam arrays iniciais vazios e setters", () => {
  assert.match(page, /useSeguindoSocialListState\(\)/);
  assert.match(hook, /useState<UsuarioSeguido\[\]>\(\[\]\)/);
  assert.match(hook, /useState<SolicitacaoSeguidor\[\]>\(\[\]\)/);
  assert.match(hook, /solicitacoesEnviadasIds, setSolicitacoesEnviadasIds/);
});
