import type { ComentarioComunidade } from "./community-comment";
import type { PostComunidade } from "./community-post-model";

export function adicionarComentarioPostComunidade(
  posts: PostComunidade[],
  postId: string,
  novoComentario: ComentarioComunidade
): PostComunidade[] {
  return posts.map((post) =>
    post.id === postId
      ? {
          ...post,
          comentarios: [...post.comentarios, novoComentario],
        }
      : post
  );
}

export function removerComentarioPostComunidade(
  posts: PostComunidade[],
  postId: string,
  comentarioId: string
): PostComunidade[] {
  return posts.map((post) =>
    post.id === postId
      ? {
          ...post,
          comentarios: post.comentarios.filter(
            (comentario) => comentario.id !== comentarioId
          ),
        }
      : post
  );
}

export function removerComentariosPostComunidade(
  posts: PostComunidade[],
  postId: string,
  idsParaRemover: Set<string>
): PostComunidade[] {
  return posts.map((post) =>
    post.id === postId
      ? {
          ...post,
          comentarios: post.comentarios.filter(
            (comentario) => !idsParaRemover.has(comentario.id)
          ),
        }
      : post
  );
}
