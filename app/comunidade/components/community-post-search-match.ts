import { normalizarTexto } from "../../../lib/utils";
import type { PostComunidade } from "./community-post-model";
import { obterTipoVisualPublicacao } from "./community-publication-visual-type";

export function postCombinaTermoBuscaComunidade(
  post: PostComunidade,
  termoBuscaNormalizado: string
) {
  if (!termoBuscaNormalizado) {
    return true;
  }

  const textoBuscaPost = normalizarTexto(
    [
      post.texto,
      post.autorNome,
      post.categoria,
      obterTipoVisualPublicacao(post),
      post.obraRelacionada,
      post.capituloRelacionado,
    ]
      .filter(Boolean)
      .join(" ")
  );

  return textoBuscaPost.includes(termoBuscaNormalizado);
}
