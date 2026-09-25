import type { PostComunidade } from "./community-post-model";

export function obterPostComentariosAbertoComunidade(
  posts: PostComunidade[],
  comentariosPostId: string | null
) {
  if (!comentariosPostId) {
    return null;
  }

  return posts.find((post) => post.id === comentariosPostId) || null;
}
