import { useCallback, useState } from "react";

export function useObraCommentRepliesVisibility() {
  const [respostasVisiveisPorComentario, setRespostasVisiveisPorComentario] =
    useState<Record<string, number>>({});

  const resetarRespostasVisiveis = useCallback(() => {
    setRespostasVisiveisPorComentario({});
  }, []);

  const garantirRespostaVisivel = useCallback((comentarioPaiId: string) => {
    setRespostasVisiveisPorComentario((estadoAtual) => ({
      ...estadoAtual,
      [comentarioPaiId]: Math.max(
        5,
        estadoAtual[comentarioPaiId] || 0,
      ),
    }));
  }, []);

  const mostrarRespostas = useCallback(
    (comentarioId: string, totalRespostas: number) => {
      setRespostasVisiveisPorComentario((estadoAtual) => ({
        ...estadoAtual,
        [comentarioId]: Math.min(5, totalRespostas),
      }));
    },
    [],
  );

  const mostrarMaisRespostas = useCallback(
    (comentarioId: string, totalRespostas: number) => {
      setRespostasVisiveisPorComentario((estadoAtual) => ({
        ...estadoAtual,
        [comentarioId]: Math.min(
          totalRespostas,
          (estadoAtual[comentarioId] || 0) + 5,
        ),
      }));
    },
    [],
  );

  const ocultarRespostas = useCallback((comentarioId: string) => {
    setRespostasVisiveisPorComentario((estadoAtual) => ({
      ...estadoAtual,
      [comentarioId]: 0,
    }));
  }, []);

  return {
    respostasVisiveisPorComentario,
    resetarRespostasVisiveis,
    garantirRespostaVisivel,
    mostrarRespostas,
    mostrarMaisRespostas,
    ocultarRespostas,
  };
}
