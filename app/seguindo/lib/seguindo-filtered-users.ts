import { normalizarTexto } from "../../../lib/utils";
import type { AbaConteudoSeguindo, FiltroSeguindo, OrdenacaoSeguindo, UsuarioSeguido } from "./seguindo-page-types";

export function filtrarUsuariosSeguindo(
  usuariosBaseSocial: UsuarioSeguido[],
  termoBusca: string,
  filtro: FiltroSeguindo,
  ordenacao: OrdenacaoSeguindo,
  abaConteudo: AbaConteudoSeguindo,
  visualizandoListaSocialDoPerfil: boolean,
): UsuarioSeguido[] {
    const filtrados = usuariosBaseSocial.filter((usuarioSeguido) => {
      if (
        abaConteudo !== "pessoas" &&
        abaConteudo !== "seguidores"
      ) {
        return false;
      }

      if (
        !visualizandoListaSocialDoPerfil &&
        filtro !== "todos" &&
        filtro !== "usuarios"
      ) {
        return false;
      }

      const textoUsuario = normalizarTexto(
        [usuarioSeguido.nome, usuarioSeguido.handle, usuarioSeguido.bio].join(" ")
      );

      return termoBusca ? textoUsuario.includes(termoBusca) : true;
    });

    return [...filtrados].sort((usuarioA, usuarioB) => {
      if (ordenacao === "titulo") {
        return usuarioA.nome.localeCompare(usuarioB.nome);
      }

      if (ordenacao === "antigos") {
        return (
          new Date(usuarioA.criadoEm).getTime() -
          new Date(usuarioB.criadoEm).getTime()
        );
      }

      return (
        new Date(usuarioB.criadoEm).getTime() - new Date(usuarioA.criadoEm).getTime()
      );
    });

}
