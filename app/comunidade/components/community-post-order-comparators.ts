import type { PostComunidade } from "./community-post-model";
import { obterPontuacaoPost } from "./community-post-score";
import { contarComentaristasUnicosPostComunidade } from "./community-unique-post-commenters-count";

export function compararPostsPorPontuacaoComunidade(
  postA: PostComunidade,
  postB: PostComunidade,
  dataOrdenacaoA: number,
  dataOrdenacaoB: number
) {
  const pontuacaoA = obterPontuacaoPost(postA);
  const pontuacaoB = obterPontuacaoPost(postB);

  return pontuacaoB - pontuacaoA || dataOrdenacaoB - dataOrdenacaoA;
}

export function compararPostsPorComentariosComunidade(
  postA: PostComunidade,
  postB: PostComunidade,
  dataOrdenacaoA: number,
  dataOrdenacaoB: number
) {
  const diferencaComentarios =
    contarComentaristasUnicosPostComunidade(postB) -
    contarComentaristasUnicosPostComunidade(postA);

  return diferencaComentarios || dataOrdenacaoB - dataOrdenacaoA;
}
