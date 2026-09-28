import type { PostComunidade } from "./community-post-model";
import type { VisibilidadePostComunidade } from "./community-post-visibility";

export function atualizarVisibilidadePostNoEstadoComunidade(
  posts: PostComunidade[],
  postId: string,
  visibilidadeSegura: VisibilidadePostComunidade
): PostComunidade[] {
  return posts.map((postAtual) =>
    postAtual.id === postId
      ? { ...postAtual, visibilidade: visibilidadeSegura }
      : postAtual
  );
}

export function atualizarFixacaoPostNoEstadoComunidade(
  posts: PostComunidade[],
  postId: string,
  dadosFixado: {
    fixado?: boolean | null;
    fixado_em?: string | null;
    fixado_por?: string | null;
  } | null
): PostComunidade[] {
  return posts.map((postAtual) => {
    if (postAtual.id !== postId) {
      return postAtual;
    }

    return {
      ...postAtual,
      fixado: Boolean(dadosFixado?.fixado),
      fixadoEm: dadosFixado?.fixado_em || "",
      fixadoPor: dadosFixado?.fixado_por || "",
    };
  });
}
