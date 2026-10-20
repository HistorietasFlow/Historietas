import type { AbaConteudoSeguindo } from "./seguindo-page-types";

export function obterMensagemEstadoVazioSeguindo(
  abaConteudo: AbaConteudoSeguindo,
  visualizandoListaSocialDoPerfil: boolean,
) {
  return abaConteudo === "seguidores"
    ? visualizandoListaSocialDoPerfil
      ? "Nenhum seguidor ainda"
      : "Você ainda não tem seguidores"
    : abaConteudo === "obras"
      ? "Nenhuma obra seguida ainda"
      : visualizandoListaSocialDoPerfil
        ? "Nenhum perfil seguido ainda"
        : "Você ainda não segue nada";
}
