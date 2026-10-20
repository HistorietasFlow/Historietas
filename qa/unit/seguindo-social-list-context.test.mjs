import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const derived = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-derived-content.ts", import.meta.url), "utf8");
const context = readFileSync(new URL("../../app/seguindo/lib/seguindo-social-list-context.ts", import.meta.url), "utf8");

test("contexto de lista social preserva condições de proprietário e perfil", () => {
  assert.match(derived, /obterContextoListaSocial\(usuarioLogadoId, perfilSocialId\)/);
  assert.match(context, /usuarioLogadoId && \(!perfilSocialId \|\| perfilSocialId === usuarioLogadoId\)/);
  assert.match(context, /perfilSocialId && perfilSocialId !== usuarioLogadoId/);
  assert.match(context, /listaSocialEhDoUsuarioLogado: Boolean\(/);
  assert.match(context, /visualizandoListaSocialDoPerfil: Boolean\(/);
});
