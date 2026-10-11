import assert from "node:assert/strict";
import test from "node:test";
import {
  encontrarItemBibliotecaMenuAberto,
  obterRotuloBibliotecaPerfil,
} from "../../app/perfil-autor/lib/profile-library-display-utils.ts";

test("encontra apenas o item correspondente ao menu aberto", () => {
  const itens = [{ chave: "a" }, { chave: "b" }];
  assert.equal(encontrarItemBibliotecaMenuAberto(itens, ""), null);
  assert.equal(encontrarItemBibliotecaMenuAberto(itens, "x"), null);
  assert.equal(encontrarItemBibliotecaMenuAberto(itens, "b"), itens[1]);
});

test("preserva os rótulos das abas da Biblioteca", () => {
  const casos = {
    tudo: "todos os itens",
    "quero-ler": "quero ler",
    "lendo-agora": "lendo agora",
    favoritas: "na lista",
    concluidas: "concluídas",
    salvos: "capítulos salvos",
    historico: "histórico",
  };

  for (const [aba, rotulo] of Object.entries(casos)) {
    assert.equal(obterRotuloBibliotecaPerfil(aba), rotulo);
  }
});
