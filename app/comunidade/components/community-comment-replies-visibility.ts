import type { ComentarioComunidade } from "./community-comment";

export function temRespostasVisiveisComunidade(
  respostasVisiveis: ComentarioComunidade[]
) {
  return respostasVisiveis.length > 0;
}

export function deveExibirBotaoVerRespostasComunidade(
  respostas: ComentarioComunidade[],
  respostasExpandidas: boolean
) {
  return respostas.length > 0 && !respostasExpandidas;
}

export function temRespostasOcultasComunidade(respostasOcultas: number) {
  return respostasOcultas > 0;
}

export function respostasEstaoExpandidasComunidade(quantidadeVisivel: number) {
  return quantidadeVisivel > 0;
}
