import type { PostComunidade } from "./community-post-model";
import type { OrdenacaoComunidade } from "./community-sort-order";
import { obterDataFixacaoOrdenacaoPostComunidade } from "./community-post-order-dates";
import { obterPontuacaoPost } from "./community-post-score";
import { contarComentaristasUnicosPostComunidade } from "./community-unique-post-commenters-count";

export function deveOrdenarPostsPorComentariosComunidade(
  ordenacaoAtiva: OrdenacaoComunidade
) {
  return ordenacaoAtiva === "Mais comentadas";
}

export function deveOrdenarPostsPorPontuacaoComunidade(
  ordenacaoAtiva: OrdenacaoComunidade
) {
  return ordenacaoAtiva === "Em alta";
}

export function obterPrioridadeFixacaoPostComunidade(post: PostComunidade) {
  return post.fixado ? -1 : 1;
}

export function compararPostsFixadosPorDataComunidade(
  postA: PostComunidade,
  postB: PostComunidade,
  dataOrdenacaoA: number,
  dataOrdenacaoB: number
) {
  const fixadoOrdenacaoA = obterDataFixacaoOrdenacaoPostComunidade(
    postA,
    dataOrdenacaoA
  );
  const fixadoOrdenacaoB = obterDataFixacaoOrdenacaoPostComunidade(
    postB,
    dataOrdenacaoB
  );

  return fixadoOrdenacaoB - fixadoOrdenacaoA;
}

export function compararDatasOrdenacaoPostsComunidade(
  dataOrdenacaoA: number,
  dataOrdenacaoB: number
) {
  return dataOrdenacaoB - dataOrdenacaoA;
}

export function compararPostsPorPontuacaoComunidade(
  postA: PostComunidade,
  postB: PostComunidade,
  dataOrdenacaoA: number,
  dataOrdenacaoB: number
) {
  const pontuacaoA = obterPontuacaoPost(postA);
  const pontuacaoB = obterPontuacaoPost(postB);

  return (
    pontuacaoB - pontuacaoA ||
    compararDatasOrdenacaoPostsComunidade(dataOrdenacaoA, dataOrdenacaoB)
  );
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

  return (
    diferencaComentarios ||
    compararDatasOrdenacaoPostsComunidade(dataOrdenacaoA, dataOrdenacaoB)
  );
}
