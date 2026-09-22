export function contarComentaristasUnicosPostComunidade(
  post: { comentarios: Array<{ autorId: string }> }
) {
  return new Set(
    post.comentarios
      .map((comentario) => comentario.autorId.trim())
      .filter(Boolean)
  ).size;
}
