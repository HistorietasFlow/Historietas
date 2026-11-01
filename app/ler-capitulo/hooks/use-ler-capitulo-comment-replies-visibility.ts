"use client";

import { useState } from "react";

type VisibilidadeRespostasCapitulo<TResposta> = {
  quantidadeVisivel: number;
  respostasVisiveis: TResposta[];
  respostasOcultas: number;
  respostasExpandidas: boolean;
};

export function useLerCapituloCommentRepliesVisibility() {
  const [respostasVisiveisPorComentario, setRespostasVisiveisPorComentario] =
    useState<Record<string, number>>({});

  function abrirRespostasComentario(
    comentarioId: string,
    quantidadeRespostas: number,
  ) {
    setRespostasVisiveisPorComentario((estadoAtual) => ({
      ...estadoAtual,
      [comentarioId]: Math.min(5, quantidadeRespostas),
    }));
  }

  function carregarMaisRespostasComentario(
    comentarioId: string,
    quantidadeRespostas: number,
  ) {
    setRespostasVisiveisPorComentario((estadoAtual) => ({
      ...estadoAtual,
      [comentarioId]: Math.min(
        quantidadeRespostas,
        (estadoAtual[comentarioId] || 0) + 5,
      ),
    }));
  }

  function ocultarRespostasComentario(comentarioId: string) {
    setRespostasVisiveisPorComentario((estadoAtual) => ({
      ...estadoAtual,
      [comentarioId]: 0,
    }));
  }

  function garantirRespostasVisiveis(comentarioId: string) {
    setRespostasVisiveisPorComentario((estadoAtual) => ({
      ...estadoAtual,
      [comentarioId]: Math.max(5, estadoAtual[comentarioId] || 0),
    }));
  }

  function obterVisibilidadeRespostas<TResposta>(
    comentarioId: string,
    respostas: TResposta[],
  ): VisibilidadeRespostasCapitulo<TResposta> {
    const quantidadeVisivel = Math.min(
      respostas.length,
      respostasVisiveisPorComentario[comentarioId] || 0,
    );
    const respostasVisiveis = respostas.slice(0, quantidadeVisivel);
    const respostasOcultas = Math.max(
      0,
      respostas.length - quantidadeVisivel,
    );

    return {
      quantidadeVisivel,
      respostasVisiveis,
      respostasOcultas,
      respostasExpandidas: quantidadeVisivel > 0,
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
