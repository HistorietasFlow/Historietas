import type { PostComunidade } from "./community-post-model";
import type { AlvoDenunciaComunidade } from "./community-report-target";

export function obterTituloDenunciaComunidade(
  alvoTipo: AlvoDenunciaComunidade,
  alvoIdLimpo: string,
  posts: PostComunidade[]
) {
  let alvoTitulo = "";

  if (alvoTipo === "post") {
    const postAlvo = posts.find((post) => post.id === alvoIdLimpo);

    alvoTitulo = postAlvo
      ? `Publicação de ${postAlvo.autorNome}`
      : "Publicação da Comunidade";
  } else {
    const comentarioAlvo = posts
      .flatMap((post) => post.comentarios)
      .find((comentario) => comentario.id === alvoIdLimpo);

    alvoTitulo = comentarioAlvo
      ? `Comentário de ${comentarioAlvo.autorNome}`
      : "Comentário da Comunidade";
  }

  return alvoTitulo;
}
