import type { PostComunidade } from "./community-post-model";
import type { UsuarioComunidade } from "./community-user";

export function usuarioCurtiuPostComunidade(
  usuario: UsuarioComunidade | null,
  post: PostComunidade
): boolean {
  return Boolean(usuario && post.curtidas.includes(usuario.id));
}

export function postEstaSalvoComunidade(
  postsSalvosIds: string[],
  post: PostComunidade
): boolean {
  return postsSalvosIds.includes(post.id);
}

export function spoilerPostEstaReveladoComunidade(
  spoilersReveladosIds: string[],
  post: PostComunidade
): boolean {
  return spoilersReveladosIds.includes(post.id);
}
