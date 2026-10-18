export function obterContextoListaSocial(
  usuarioLogadoId: string,
  perfilSocialId: string,
) {
  return {
    listaSocialEhDoUsuarioLogado: Boolean(
      usuarioLogadoId && (!perfilSocialId || perfilSocialId === usuarioLogadoId),
    ),
    visualizandoListaSocialDoPerfil: Boolean(
      perfilSocialId && perfilSocialId !== usuarioLogadoId,
    ),
  };
}
