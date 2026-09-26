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
