import type { UsuarioBuscaComunidade } from "./community-user";

export function temResultadosBuscaUsuariosComunidade(
  usuariosBuscaComunidade: UsuarioBuscaComunidade[]
) {
  return usuariosBuscaComunidade.length > 0;
}
