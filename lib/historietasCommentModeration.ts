export function usuarioPodeGerenciarComentario(
  usuarioId: string,
  comentarioAutorId: string,
  obraAutorId: string,
) {
  const usuarioIdLimpo = usuarioId.trim();

  return Boolean(
    usuarioIdLimpo &&
      (comentarioAutorId.trim() === usuarioIdLimpo ||
        obraAutorId.trim() === usuarioIdLimpo),
  );
}
