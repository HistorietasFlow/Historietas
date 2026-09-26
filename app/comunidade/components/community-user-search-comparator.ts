import { normalizarTexto } from "../../../lib/utils";
import type { UsuarioBuscaComunidade } from "./community-user";

export function compararUsuariosBuscaComunidade(
  usuarioA: UsuarioBuscaComunidade,
  usuarioB: UsuarioBuscaComunidade,
  termoNormalizado: string
) {
  const textoA = normalizarTexto(`${usuarioA.nome} ${usuarioA.username}`);
  const textoB = normalizarTexto(`${usuarioB.nome} ${usuarioB.username}`);
  const prefixoA = textoA.startsWith(termoNormalizado);
  const prefixoB = textoB.startsWith(termoNormalizado);

  if (prefixoA !== prefixoB) {
    return prefixoA ? -1 : 1;
  }

  return usuarioA.nome.localeCompare(usuarioB.nome, "pt-BR");
}

export function ordenarUsuariosBuscaComunidade(
  usuarios: UsuarioBuscaComunidade[],
  termoNormalizado: string
) {
  return usuarios.sort((usuarioA, usuarioB) =>
    compararUsuariosBuscaComunidade(
      usuarioA,
      usuarioB,
      termoNormalizado
    )
  );
}
