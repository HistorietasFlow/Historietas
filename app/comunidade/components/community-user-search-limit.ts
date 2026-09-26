import type { UsuarioBuscaComunidade } from "./community-user";

export function limitarUsuariosBuscaComunidade(
  usuarios: UsuarioBuscaComunidade[]
) {
  return usuarios.slice(0, 12);
}
