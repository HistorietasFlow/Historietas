import type { PostComunidade } from "./community-post-model";

export function obterDataOrdenacaoPostComunidade(post: PostComunidade) {
  const data = new Date(post.criadoEm).getTime();

  return Number.isNaN(data) ? 0 : data;
}

export function obterDataFixacaoOrdenacaoPostComunidade(
  post: PostComunidade,
  dataOrdenacao: number
) {
  const dataFixacao = new Date(post.fixadoEm || post.criadoEm).getTime();

  return Number.isNaN(dataFixacao) ? dataOrdenacao : dataFixacao;
}
