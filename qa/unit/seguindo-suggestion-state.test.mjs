import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-suggestion-state.ts", import.meta.url), "utf8");

test("sugestões preservam lista vazia, carregamento e identificador pendente", () => {
  assert.match(page, /useSeguindoSuggestionState\(\)/);
  assert.match(hook, /useState<\s*UsuarioSeguido\[\]\s*>\(\[\]\)/);
  assert.match(hook, /const \[carregandoUsuariosSugestoes, setCarregandoUsuariosSugestoes\]\s*=\s*useState\(false\)/);
  assert.match(hook, /const \[usuarioSugestaoSeguindoId, setUsuarioSugestaoSeguindoId\]\s*=\s*useState<string \| null>\(null\)/);
  for (const nome of ["usuariosSugestoesBusca", "setUsuariosSugestoesBusca", "carregandoUsuariosSugestoes", "setCarregandoUsuariosSugestoes", "usuarioSugestaoSeguindoId", "setUsuarioSugestaoSeguindoId"]) {
    assert.match(hook, new RegExp("\\b" + nome + "\\b"));
  }
});
