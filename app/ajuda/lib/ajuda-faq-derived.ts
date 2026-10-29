import type {
  HistorietasLanguage,
} from "../../../lib/i18n";

import {
  normalizarTexto,
} from "../../../lib/utils";

import type {
  CategoriaAjuda,
  CategoriaAjudaId,
  PerguntaAjuda,
} from "./ajuda-content";

import {
  traduzirTexto,
} from "./ajuda-display-utils";

export function filtrarPerguntasAjuda({
  perguntas,
  busca,
  categoriaAtiva,
  language,
}: {
  perguntas: PerguntaAjuda[];
  busca: string;
  categoriaAtiva: CategoriaAjudaId;
  language: HistorietasLanguage;
}) {
  const buscaNormalizada =
    normalizarTexto(busca);

  return perguntas.filter((item) => {
    const correspondeCategoria =
      categoriaAtiva === "todos" ||
      item.categoria === categoriaAtiva;

    if (!correspondeCategoria) {
      return false;
    }

    if (!buscaNormalizada) {
      return true;
    }

    const conteudo =
      normalizarTexto(
        `${traduzirTexto(
          item.pergunta,
          language,
        )} ${traduzirTexto(
          item.resposta,
          language,
        )} ${traduzirTexto(
          item.palavrasChave,
          language,
        )}`,
      );

    return conteudo.includes(
      buscaNormalizada,
    );
  });
}

export function obterCategoriaAjudaSelecionada(
  categorias: CategoriaAjuda[],
  categoriaAtiva: CategoriaAjudaId,
) {
  return (
    categorias.find(
      (categoria) =>
        categoria.id === categoriaAtiva,
    ) ||
    categorias[0]
  );
}
