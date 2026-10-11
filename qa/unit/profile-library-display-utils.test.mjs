import assert from "node:assert/strict";
import test from "node:test";
import {
  encontrarItemBibliotecaMenuAberto,
  obterMetaMenuBibliotecaPerfil,
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


test("monta a meta do menu da Biblioteca com tipo, capítulo e progresso", () => {
  const item = {
    tipoDiario: "lendo",
    capitulo: { id: "cap-2" },
    numeroCapitulo: 2,
    obra: {
      capitulos: [{ id: "cap-1" }, { id: "cap-2" }, { id: "cap-3" }],
      progressoLeitura: 74.6,
    },
  };

  assert.equal(
    obterMetaMenuBibliotecaPerfil(item),
    "Lendo • Capítulo 2 de 3 • 75% concluído",
  );
});

test("preserva rótulos, pluralização, fallback e limites de progresso", () => {
  const casos = [
    ["favorita", 1, 140, "Favorita • 1 capítulo • 100% concluído"],
    ["concluida", 2, -15, "Concluída • 2 capítulos • 0% concluído"],
    ["quero_ler", 0, 10, "Quero ler • Obra • 10% concluído"],
    ["avaliacao", 0, 0, "Biblioteca • Obra • 0% concluído"],
  ];

  for (const [tipoDiario, totalCapitulos, progressoLeitura, esperado] of casos) {
    assert.equal(
      obterMetaMenuBibliotecaPerfil({
        tipoDiario,
        capitulo: null,
        numeroCapitulo: 0,
        obra: {
          capitulos: Array.from({ length: totalCapitulos }, (_, indice) => ({
            id: `cap-${indice + 1}`,
          })),
          progressoLeitura,
        },
      }),
      esperado,
    );
  }
});
