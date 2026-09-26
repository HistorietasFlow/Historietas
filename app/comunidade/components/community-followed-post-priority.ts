import type { PostComunidade } from "./community-post-model";

export function obterPrioridadeAutorSeguidoComunidade(
  post: PostComunidade,
  usuariosSeguidosIds: string[]
) {
  return usuariosSeguidosIds.includes(post.autorId) ? 1 : 0;
}
