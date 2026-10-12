import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-block-state-sync.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);

test("Perfil de Autor delega a sincronização do bloqueio", () => {
  assert.match(pagina, /usePerfilAutorBlockStateSync/);
  assert.match(
    pagina,
    /usePerfilAutorBlockStateSync\(\{[\s\S]*?perfilAutorId,[\s\S]*?usuarioIdLogado,[\s\S]*?setEstadoBloqueioPerfil,[\s\S]*?\}\)/,
  );
  assert.doesNotMatch(pagina, /async function carregarBloqueioPerfil\(/);
});

test("hook preserva o fallback de bloqueio vazio", () => {
  assert.match(source, /!perfilUserId/);
  assert.match(source, /!usuarioAtualId/);
  assert.match(source, /perfilUserId === usuarioAtualId/);
  assert.match(source, /!idAutorSupabaseValido\(perfilUserId\)/);
  assert.match(
    source,
    /bloqueadoPorMim: false,[\s\S]*?bloqueadoPeloPerfil: false,[\s\S]*?existeBloqueio: false/,
  );
});

test("hook preserva leitura remota, timer e cancelamento", () => {
  assert.match(source, /await carregarEstadoBloqueioPerfil\(perfilUserId\)/);
  assert.match(source, /let cancelado = false;/);
  assert.match(source, /if \(!cancelado\) \{/);
  assert.match(
    source,
    /window\.setTimeout\(\(\) => \{\s*void carregarBloqueioPerfil\(\);\s*\}, 0\)/,
  );
  assert.match(source, /cancelado = true;/);
  assert.match(source, /window\.clearTimeout\(carregarBloqueioTimer\)/);
});
