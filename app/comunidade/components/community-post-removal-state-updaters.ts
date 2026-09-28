import type { PostComunidade } from "./community-post-model";

export function removerPostDoEstadoComunidade(
  posts: PostComunidade[],
  postId: string
): PostComunidade[] {
  return posts.filter((post) => post.id !== postId);
}

export function removerPostSalvoDoEstadoComunidade(
  postsSalvosIds: string[],
  postId: string
): string[] {
  return postsSalvosIds.filter((postSalvoId) => postSalvoId !== postId);
}
