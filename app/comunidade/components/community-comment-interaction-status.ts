import type { ComentarioComunidade } from "./community-comment";

export function usuarioCurtiuComentarioComunidade(
  usuarioId: string,
  comentario: ComentarioComunidade
) {
  return Boolean(usuarioId && comentario.curtidas.includes(usuarioId));
}

export function usuarioPodeRemoverComentarioComunidade(
  usuarioId: string,
  comentario: ComentarioComunidade
) {
  return Boolean(usuarioId && comentario.autorId === usuarioId);
}

export function usuarioPodeDenunciarComentarioComunidade(
  usuarioId: string,
  comentario: ComentarioComunidade
) {
  return Boolean(usuarioId && comentario.autorId !== usuarioId);
}

export function comentarioEstaSendoCurtidoComunidade(
  comentarioCurtindoId: string | null,
  comentario: ComentarioComunidade
) {
  return comentarioCurtindoId === comentario.id;
}

export function comentarioEstaSendoRemovidoComunidade(
  comentarioRemovendoId: string | null,
  comentario: ComentarioComunidade
) {
  return comentarioRemovendoId === comentario.id;
}

export function comentarioEstaSendoDenunciadoComunidade(
  comentarioDenunciandoId: string | null,
  comentario: ComentarioComunidade
) {
  return comentarioDenunciandoId === comentario.id;
}

export function deveDesabilitarCurtidaComentarioComunidade(
  podeComentar: boolean,
  comentarioCurtindo: boolean
) {
  return !podeComentar || comentarioCurtindo;
}
