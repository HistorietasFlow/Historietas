import type { AbaConteudoSeguindo, UsuarioSeguido } from "./seguindo-page-types";

export function selecionarUsuariosBaseSocial(
  abaConteudo: AbaConteudoSeguindo,
  usuariosSeguidores: UsuarioSeguido[],
  usuariosSeguidos: UsuarioSeguido[],
): UsuarioSeguido[] {
  return abaConteudo === "seguidores" ? usuariosSeguidores : usuariosSeguidos;
}
