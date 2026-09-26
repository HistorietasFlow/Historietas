export function usuarioBuscaEhUsuarioAtualComunidade(
  usuarioAtualId: string | undefined,
  usuarioBuscaId: string
) {
  return usuarioAtualId === usuarioBuscaId;
}

export function usuarioBuscaEhSeguidoComunidade(
  usuariosSeguidosIds: string[],
  usuarioBuscaId: string
) {
  return usuariosSeguidosIds.includes(usuarioBuscaId);
}

export function usuarioBuscaEstaAtualizandoSeguimentoComunidade(
  usuarioSeguindoId: string | null,
  usuarioBuscaId: string
) {
  return usuarioSeguindoId === usuarioBuscaId;
}
