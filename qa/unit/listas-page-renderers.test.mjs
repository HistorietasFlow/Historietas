import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/listas/page.tsx", "utf8");
const category = readFileSync("app/listas/hooks/use-listas-category-navigation.ts", "utf8");
const renderers = readFileSync("app/listas/hooks/use-listas-page-renderers.tsx", "utf8");

test("Listas delega navegação de categoria e renderizadores públicos", () => {
  assert.match(page, /useListasCategoryNavigation<CategoriaPerfil>\(\{/);
  assert.doesNotMatch(page, /function trocarCategoria\(/);
  assert.match(category, /new URLSearchParams\(queryAtual\)/);
  assert.match(category, /router\.replace\(`\/listas\?\$\{params\.toString\(\)\}`, \{ scroll: false \}\)/);
  assert.match(renderers, /abrirMenuObra\(obra, null, "tudo"\)/);
  assert.match(renderers, /autorId=\$\{encodeURIComponent\(autor\.id\)\}/);
  assert.match(renderers, /autor=\$\{encodeURIComponent\(autor\.nome\)\}/);
  assert.match(renderers, /key=\{obra\.id\}/);
  assert.match(renderers, /key=\{autor\.id \|\| autor\.nome\}/);
  assert.match(renderers, /criarCapaStyle\(obra\.capa\)/);
  assert.match(renderers, /criarAvatarStyle\(autor\.avatar\)/);
  assert.match(renderers, /rowOptionsButtonStyle/);
  assert.match(renderers, /rowAuthorLinkStyle/);
});
