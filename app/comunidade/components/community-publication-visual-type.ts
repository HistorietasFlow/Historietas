import { postEhEnquete } from "./community-post-poll-check";

export function obterTipoVisualPublicacao<TipoPublicacao extends string>(
  post: { texto: string; tipoPublicacao: TipoPublicacao }
): TipoPublicacao | "Enquete" {
  return postEhEnquete(post) ? "Enquete" : post.tipoPublicacao;
}
