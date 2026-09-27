import type { Dispatch, SetStateAction } from "react";
import type { ComentarioComunidade } from "./community-comment";
import {
  obterProximaQuantidadeRespostasVisiveisComunidade,
  obterQuantidadeInicialRespostasVisiveisComunidade,
} from "./community-comment-replies-pagination";

type SetRespostasVisiveisPorComentario = Dispatch<
  SetStateAction<Record<string, number>>
>;

type MostrarRespostasComunidadeParams = {
  respostas: ComentarioComunidade[];
  comentario: ComentarioComunidade;
  setRespostasVisiveisPorComentario: SetRespostasVisiveisPorComentario;
};

type OcultarRespostasComunidadeParams = {
  comentario: ComentarioComunidade;
  setRespostasVisiveisPorComentario: SetRespostasVisiveisPorComentario;
};

export function mostrarRespostasIniciaisComunidade({
  respostas,
  comentario,
  setRespostasVisiveisPorComentario,
}: MostrarRespostasComunidadeParams): void {
  setRespostasVisiveisPorComentario((estadoAtual) => ({
    ...estadoAtual,
    [comentario.id]:
      obterQuantidadeInicialRespostasVisiveisComunidade(respostas),
  }));
}

export function mostrarMaisRespostasComunidade({
  respostas,
  comentario,
  setRespostasVisiveisPorComentario,
}: MostrarRespostasComunidadeParams): void {
  setRespostasVisiveisPorComentario((estadoAtual) => ({
    ...estadoAtual,
    [comentario.id]:
      obterProximaQuantidadeRespostasVisiveisComunidade(
        respostas,
        estadoAtual[comentario.id]
      ),
  }));
}

export function ocultarRespostasComunidade({
  comentario,
  setRespostasVisiveisPorComentario,
}: OcultarRespostasComunidadeParams): void {
  setRespostasVisiveisPorComentario((estadoAtual) => ({
    ...estadoAtual,
    [comentario.id]: 0,
  }));
}
