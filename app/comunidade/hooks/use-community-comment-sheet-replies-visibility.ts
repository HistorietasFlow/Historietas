"use client";

import { useState } from "react";
import type { ComentarioComunidade } from "../components/community-comment";
import {
  mostrarMaisRespostasComunidade,
  mostrarRespostasIniciaisComunidade,
  ocultarRespostasComunidade,
} from "../components/community-comment-replies-pagination-actions";
import {
  obterQuantidadeRespostasOcultasComunidade,
  obterQuantidadeRespostasVisiveisComunidade,
  obterRespostasVisiveisComunidade,
} from "../components/community-comment-replies-pagination";
import { respostasEstaoExpandidasComunidade } from "../components/community-comment-replies-visibility";

export type VisibilidadeRespostasComunidade = {
  quantidadeVisivel: number;
  respostasVisiveis: ComentarioComunidade[];
  respostasOcultas: number;
  respostasExpandidas: boolean;
};

export function useCommunityCommentSheetRepliesVisibility() {
  const [respostasVisiveisPorComentario, setRespostasVisiveisPorComentario] =
    useState<Record<string, number>>({});

  function abrirRespostasComentario(
    respostas: ComentarioComunidade[],
    comentario: ComentarioComunidade,
  ) {
    mostrarRespostasIniciaisComunidade({
      respostas,
      comentario,
      setRespostasVisiveisPorComentario,
    });
  }

  function carregarMaisRespostasComentario(
    respostas: ComentarioComunidade[],
    comentario: ComentarioComunidade,
  ) {
    mostrarMaisRespostasComunidade({
      respostas,
      comentario,
      setRespostasVisiveisPorComentario,
    });
  }

  function ocultarRespostasComentario(comentario: ComentarioComunidade) {
    ocultarRespostasComunidade({
      comentario,
      setRespostasVisiveisPorComentario,
    });
  }

  function garantirRespostasVisiveis(comentarioId: string) {
    setRespostasVisiveisPorComentario((estadoAtual) => ({
      ...estadoAtual,
      [comentarioId]: Math.max(5, estadoAtual[comentarioId] || 0),
    }));
  }

  function obterVisibilidadeRespostas(
    respostas: ComentarioComunidade[],
    comentario: ComentarioComunidade,
  ): VisibilidadeRespostasComunidade {
    const quantidadeVisivel = obterQuantidadeRespostasVisiveisComunidade(
      respostas,
      respostasVisiveisPorComentario,
      comentario,
    );
    const respostasVisiveis = obterRespostasVisiveisComunidade(
      respostas,
      quantidadeVisivel,
    );
    const respostasOcultas = obterQuantidadeRespostasOcultasComunidade(
      respostas,
      quantidadeVisivel,
    );

    return {
      quantidadeVisivel,
      respostasVisiveis,
      respostasOcultas,
      respostasExpandidas:
        respostasEstaoExpandidasComunidade(quantidadeVisivel),
    };
  }

  return {
    abrirRespostasComentario,
    carregarMaisRespostasComentario,
    ocultarRespostasComentario,
    garantirRespostasVisiveis,
    obterVisibilidadeRespostas,
  };
}
