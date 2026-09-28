import type { PostComunidade } from "./community-post-model";

export function atualizarCurtidaPostComunidade(
  posts: PostComunidade[],
  postId: string,
  usuarioId: string,
  jaCurtiu: boolean
): PostComunidade[] {
  return posts.map((post) => {
    if (post.id !== postId) {
      return post;
    }

    return {
      ...post,
      curtidas: jaCurtiu
        ? post.curtidas.filter((curtidaId) => curtidaId !== usuarioId)
        : Array.from(new Set([...post.curtidas, usuarioId])),
    };
  });
}

export function atualizarCurtidaComentarioComunidade(
  posts: PostComunidade[],
  postId: string,
  comentarioId: string,
  usuarioId: string,
  jaCurtiu: boolean
): PostComunidade[] {
  return posts.map((post) => {
    if (post.id !== postId) {
      return post;
    }

    return {
      ...post,
      comentarios: post.comentarios.map((comentario) => {
        if (comentario.id !== comentarioId) {
          return comentario;
        }

        return {
          ...comentario,
          curtidas: jaCurtiu
            ? comentario.curtidas.filter((curtidaId) => curtidaId !== usuarioId)
            : Array.from(new Set([...comentario.curtidas, usuarioId])),
        };
      }),
    };
  });
}
