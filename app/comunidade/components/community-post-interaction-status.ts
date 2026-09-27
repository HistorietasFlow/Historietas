import type { DenunciaAlvoComunidade } from "./community-report-target";
import type { PostComunidade } from "./community-post-model";
import type { UsuarioComunidade } from "./community-user";

export function usuarioCurtiuPostComunidade(
  usuario: UsuarioComunidade | null,
  post: PostComunidade
): boolean {
  return Boolean(usuario && post.curtidas.includes(usuario.id));
}

export function postEstaSalvoComunidade(
  postsSalvosIds: string[],
  post: PostComunidade
): boolean {
  return postsSalvosIds.includes(post.id);
}

export function spoilerPostEstaReveladoComunidade(
  spoilersReveladosIds: string[],
  post: PostComunidade
): boolean {
  return spoilersReveladosIds.includes(post.id);
}

export function postEstaSendoCurtido(
  postCurtindoId: string | null,
  post: PostComunidade
): boolean {
  return postCurtindoId === post.id;
}

export function postEstaSendoSalvo(
  postSalvandoId: string | null,
  post: PostComunidade
): boolean {
  return postSalvandoId === post.id;
}

export function postEstaSendoCompartilhado(
  postCompartilhandoId: string | null,
  post: PostComunidade
): boolean {
  return postCompartilhandoId === post.id;
}

export function postEstaSendoRemovido(
  postRemovendoId: string | null,
  post: PostComunidade
): boolean {
  return postRemovendoId === post.id;
}

export function postEstaSendoFixado(
  postFixandoId: string | null,
  post: PostComunidade
): boolean {
  return postFixandoId === post.id;
}

export function postEstaAtualizandoVisibilidade(
  postVisibilidadeAtualizandoId: string | null,
  post: PostComunidade
): boolean {
  return postVisibilidadeAtualizandoId === post.id;
}

export function postEstaSendoDenunciadoComunidade(
  denunciaAlvo: DenunciaAlvoComunidade | null,
  post: PostComunidade
): boolean {
  return Boolean(
    denunciaAlvo?.alvoTipo === "post" && denunciaAlvo.alvoId === post.id
  );
}

export function menuOpcoesPostEstaAbertoComunidade(
  postMenuAbertoId: string | null,
  post: PostComunidade
): boolean {
  return postMenuAbertoId === post.id;
}

export function deveOcultarTextoSpoilerComunidade(
  post: PostComunidade,
  spoilerRevelado: boolean
): boolean {
  return post.temSpoiler && !spoilerRevelado;
}
