import assert from "node:assert/strict";
import test from "node:test";
import {
  encontrarItemBibliotecaMenuAberto,
  obterMensagemBibliotecaVaziaPerfil,
  obterMetaMenuBibliotecaPerfil,
  obterRotuloAcaoRemoverBibliotecaPerfil,
  obterRotulosAcoesColecoesBibliotecaPerfil,
  obterRotuloBibliotecaPerfil,
} from "../../app/perfil-autor/lib/profile-library-display-utils.ts";

test("encontra apenas o item correspondente ao menu aberto", () => {
  const itens = [{ chave: "a" }, { chave: "b" }];
  assert.equal(encontrarItemBibliotecaMenuAberto(itens, ""), null);
  assert.equal(encontrarItemBibliotecaMenuAberto(itens, "x"), null);
  assert.equal(encontrarItemBibliotecaMenuAberto(itens, "b"), itens[1]);
});

test("mensagem vazia da Biblioteca preserva o rótulo da aba ativa", () => {
  assert.equal(
    obterMensagemBibliotecaVaziaPerfil("quero ler"),
    "Sua Biblioteca ainda não tem itens em quero ler.",
  );
  assert.equal(
    obterMensagemBibliotecaVaziaPerfil("capítulos salvos"),
    "Sua Biblioteca ainda não tem itens em capítulos salvos.",
  );
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


test("preserva os rótulos das ações de coleção da Biblioteca", () => {
  assert.deepEqual(
    obterRotulosAcoesColecoesBibliotecaPerfil({
      obraNoQueroLer: false,
      obraFavorita: false,
      obraConcluida: false,
    }),
    {
      rotuloQueroLer: "Quero ler",
      rotuloFavorita: "Favoritar",
      rotuloConcluida: "Concluir",
    },
  );

  assert.deepEqual(
    obterRotulosAcoesColecoesBibliotecaPerfil({
      obraNoQueroLer: true,
      obraFavorita: true,
      obraConcluida: true,
    }),
    {
      rotuloQueroLer: "Remover do Quero ler",
      rotuloFavorita: "Remover favorita",
      rotuloConcluida: "Marcar como não concluída",
    },
  );
});


test("preserva o rótulo da ação de remoção da Biblioteca por aba", () => {
  const casos = {
    tudo: "Remover",
    "quero-ler": "Remover",
    "lendo-agora": "Parar leitura",
    favoritas: "Remover",
    concluidas: "Remover",
    salvos: "Remover",
    historico: "Limpar histórico",
  };

  for (const [aba, rotulo] of Object.entries(casos)) {
    assert.equal(obterRotuloAcaoRemoverBibliotecaPerfil(aba), rotulo);
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
