import type { PostComunidade } from "./community-post-model";

export function deveOcultarPostPorFiltroSalvosComunidade(
  post: PostComunidade,
  mostrarApenasSalvos: boolean,
  postsSalvosIds: string[]
) {
  return mostrarApenasSalvos && !postsSalvosIds.includes(post.id);
}
