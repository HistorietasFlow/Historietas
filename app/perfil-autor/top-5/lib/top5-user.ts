import type { UsuarioTop5 } from "./top5-types";

export function criarUsuarioTop5(
  userId: string,
  nomeUsuario: string,
): UsuarioTop5 | null {
  return userId
    ? {
        id: userId,
        nome: nomeUsuario,
      }
    : null;
}
