import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-interaction-totals-sync.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);

test("Perfil de Autor delega a sincronização dos totais de interações", () => {
  assert.match(pagina, /usePerfilAutorInteractionTotalsSync/);
  assert.match(
    pagina,
    /usePerfilAutorInteractionTotalsSync\(\{[\s\S]*?obras,[\s\S]*?setTotaisInteracoesObras,[\s\S]*?\}\)/,
  );
  assert.doesNotMatch(pagina, /async function carregarTotaisReaisPerfil\(/);
});

test("hook preserva fallback vazio e leitura remota", () => {
  assert.match(source, /if \(obras\.length === 0\)/);
  assert.match(
    source,
    /setTotaisInteracoesObras\(totaisInteracoesObrasPerfilVazio\)/,
  );
  assert.match(
    source,
    /await carregarTotaisInteracoesObrasPerfilAutor\(obras\)/,
  );
});

test("hook preserva cancelamento antes de aplicar totais", () => {
  assert.match(source, /let cancelado = false;/);
  assert.match(
    source,
    /if \(!cancelado\) \{\s*setTotaisInteracoesObras\(totaisReais\);\s*\}/,
  );
  assert.match(source, /cancelado = true;/);
});
