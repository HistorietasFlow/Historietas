import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-visible-tab-sync.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);

test("Perfil de Autor delega a correção da aba visível", () => {
  assert.match(pagina, /usePerfilAutorVisibleTabSync/);
  assert.match(
    pagina,
    /usePerfilAutorVisibleTabSync\(\{[\s\S]*?abaPerfil,[\s\S]*?obrasPerfilVisivel,[\s\S]*?diarioPerfilVisivel,[\s\S]*?comunidadePerfilVisivel,[\s\S]*?sobrePerfilVisivel,[\s\S]*?bibliotecaPerfilVisivel,[\s\S]*?primeiraAbaPerfilVisivel,[\s\S]*?setAbaPerfil,[\s\S]*?\}\)/,
  );
  assert.doesNotMatch(pagina, /const abaAtualVisivel =/);
});

test("hook preserva a validação da aba atual", () => {
  for (const aba of ["obras", "diario", "comunidade", "sobre", "biblioteca"]) {
    assert.match(source, new RegExp(`abaPerfil === "${aba}"`));
  }
  assert.match(source, /if \(!abaAtualVisivel && primeiraAbaPerfilVisivel\)/);
});

test("hook preserva timer, atualização e cleanup", () => {
  assert.match(
    source,
    /window\.setTimeout\(\(\) => \{\s*setAbaPerfil\(primeiraAbaPerfilVisivel\);\s*\}, 0\)/,
  );
  assert.match(source, /window\.clearTimeout\(corrigirAbaTimer\)/);
});
