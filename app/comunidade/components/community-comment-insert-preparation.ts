import type { PostComunidade } from "./community-post-model";

type PrepararInsercaoComentarioComunidadeParams = {
  posts: PostComunidade[];
  postId: string;
  textoComentario: string;
  comentarioPaiId: string;
  usuarioId: string;
  autorNomeSeguro: string;
};

type ResultadoPreparacaoInsercaoComentarioComunidade =
  | { valido: false; erro: string }
  | {
      valido: true;
      postAtual: PostComunidade | null;
      comentarioPaiIdLimpo: string;
      dadosComentarioBanco: {
        post_id: string;
        autor_id: string;
        autor_nome: string;
        texto: string;
        comentario_pai_id: string | null;
      };
    };

export function prepararInsercaoComentarioComunidade({
  posts,
  postId,
  textoComentario,
  comentarioPaiId,
  usuarioId,
  autorNomeSeguro,
}: PrepararInsercaoComentarioComunidadeParams): ResultadoPreparacaoInsercaoComentarioComunidade {
  const postAtual = posts.find((post) => post.id === postId) || null;
  const comentarioPaiIdLimpo = comentarioPaiId.trim();
  const comentarioPai = comentarioPaiIdLimpo
    ? postAtual?.comentarios.find(
        (comentario) => comentario.id === comentarioPaiIdLimpo
      ) || null
    : null;

  if (comentarioPaiIdLimpo && !comentarioPai) {
    return {
      valido: false,
      erro: "O comentário respondido não foi encontrado.",
    };
  }

  const dadosComentarioBanco = {
    post_id: postId,
    autor_id: usuarioId,
    autor_nome: autorNomeSeguro,
    texto: textoComentario.slice(0, 420),
    comentario_pai_id: comentarioPaiIdLimpo || null,
  };

  return {
    valido: true,
    postAtual,
    comentarioPaiIdLimpo,
    dadosComentarioBanco,
  };
}
