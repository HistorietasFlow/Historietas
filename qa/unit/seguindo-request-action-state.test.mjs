import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-request-action-state.ts", import.meta.url), "utf8");

test("ações sociais preservam IDs pendentes inicialmente nulos", () => {
  assert.match(page, /useSeguindoPageSocialState\(\)/);
  assert.match(hook, /const \[solicitacaoRespondendoId, setSolicitacaoRespondendoId\] = useState<\s*string \| null\s*>\(null\)/);
  assert.match(hook, /const \[usuarioListaAlterandoId, setUsuarioListaAlterandoId\] = useState<\s*string \| null\s*>\(null\)/);
  assert.match(hook, /return \{[\s\S]*solicitacaoRespondendoId, setSolicitacaoRespondendoId,[\s\S]*usuarioListaAlterandoId, setUsuarioListaAlterandoId,/);
});
