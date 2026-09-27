import type { ComentarioComunidade } from "./community-comment";

export function obterQuantidadeRespostasVisiveisComunidade(
  respostas: ComentarioComunidade[],
  respostasVisiveisPorComentario: Record<string, number>,
  comentario: ComentarioComunidade
) {
  return Math.min(
    respostas.length,
    respostasVisiveisPorComentario[comentario.id] || 0
  );
}

export function obterRespostasVisiveisComunidade(
  respostas: ComentarioComunidade[],
  quantidadeVisivel: number
) {
  return respostas.slice(0, quantidadeVisivel);
}

export function obterQuantidadeRespostasOcultasComunidade(
  respostas: ComentarioComunidade[],
  quantidadeVisivel: number
) {
  return Math.max(0, respostas.length - quantidadeVisivel);
}

export function obterQuantidadeInicialRespostasVisiveisComunidade(
  respostas: ComentarioComunidade[]
) {
  return Math.min(5, respostas.length);
}

export function obterProximaQuantidadeRespostasVisiveisComunidade(
  respostas: ComentarioComunidade[],
  quantidadeAtual: number
) {
  return Math.min(respostas.length, (quantidadeAtual || 0) + 5);
}
