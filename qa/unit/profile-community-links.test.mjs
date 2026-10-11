import assert from "node:assert/strict";
import test from "node:test";
import { criarLinksComunidadePerfilAutor } from "../../app/perfil-autor/lib/profile-community-links.ts";

test("gera links da Comunidade com busca codificada", () => {
  assert.deepEqual(criarLinksComunidadePerfilAutor("Autor Teste"), {
    geral: "/comunidade?busca=Autor%20Teste",
    teorias: "/comunidade?busca=Autor%20Teste&tipo=Teoria",
    reviews: "/comunidade?busca=Autor%20Teste&tipo=Review",
  });
});

test("preserva fallbacks sem nome do autor", () => {
  assert.deepEqual(criarLinksComunidadePerfilAutor(""), {
    geral: "/comunidade",
    teorias: "/comunidade?tipo=Teoria",
    reviews: "/comunidade?tipo=Review",
  });
});
