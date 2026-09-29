import type { ComentarioComunidade } from "./community-comment";
import type { PostComunidade } from "./community-post-model";

type ResultadoPreparacaoRemocaoComentarioComunidade =
  | { valido: false; erro: string }
  | {
      valido: true;
      comentariosDoPost: ComentarioComunidade[];
    };

export function prepararRemocaoComentarioComunidade(
  posts: PostComunidade[],
  postId: string,
  comentarioId: string,
  usuarioAutenticadoId: string
): ResultadoPreparacaoRemocaoComentarioComunidade {
  const comentariosDoPost =
    posts.find((post) => post.id === postId)?.comentarios || [];
  const comentarioAtual = comentariosDoPost.find(
    (comentario) => comentario.id === comentarioId
  );

  if (
    !comentarioAtual ||
    comentarioAtual.autorId.trim() !== usuarioAutenticadoId
  ) {
    return {
      valido: false,
      erro: "Você só pode remover seus próprios comentários.",
    };
  }

  return {
    valido: true,
    comentariosDoPost,
  };
}
