export function usuarioPodeRemoverPostComunidade(
  carregandoUsuario: boolean,
  usuarioAtualId: string,
  autorPostId: string,
  usuarioEhAdmin: boolean
): boolean {
  return Boolean(
    !carregandoUsuario &&
      usuarioAtualId &&
      (autorPostId === usuarioAtualId || usuarioEhAdmin)
  );
}

export function usuarioPodeDenunciarPostComunidade(
  carregandoUsuario: boolean,
  usuarioAtualId: string,
  autorPostId: string
): boolean {
  return Boolean(
    !carregandoUsuario &&
      usuarioAtualId &&
      autorPostId !== usuarioAtualId
  );
}

export function usuarioPodeAlterarVisibilidadePostComunidade(
  carregandoUsuario: boolean,
  usuarioAtualId: string,
  autorPostId: string
): boolean {
  return Boolean(
    !carregandoUsuario &&
      usuarioAtualId &&
      autorPostId === usuarioAtualId
  );
}
