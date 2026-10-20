import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);
const hook = readFileSync(
  new URL("../../app/seguindo/hooks/use-seguindo-social-list-state.ts", import.meta.url),
  "utf8",
);

test("listas sociais preservam arrays iniciais e setters", () => {
  assert.match(
    page,
    /import \{ useSeguindoPageState \} from "\.\/hooks\/use-seguindo-page-state";/,
  );
  assert.match(page, /\} = useSeguindoPageState\(\);/);
  assert.match(hook, /^"use client";/);
  assert.match(hook, /useState<UsuarioSeguido\[\]>\(\[\]\)/);
  assert.match(hook, /useState<\s*SolicitacaoSeguidor\[\]\s*>\(\[\]\)/);
  assert.match(hook, /useState<\s*string\[\]\s*>\(\[\]\)/);
  for (const value of [
    "setUsuariosSeguidos",
    "setUsuariosSeguidores",
    "setSolicitacoesSeguidores",
    "setSolicitacoesEnviadasIds",
  ]) {
    assert.match(hook, new RegExp(value));
  }
  assert.doesNotMatch(hook, /supabase|localStorage|useEffect|fetch\(/);
});
