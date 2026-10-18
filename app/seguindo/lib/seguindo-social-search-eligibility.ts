import type { AbaConteudoSeguindo } from "./seguindo-page-types";

export function buscaSugestoesUsuariosEstaAtiva(
  buscaSeguindoAberta: boolean,
  termoBusca: string,
  visualizandoListaSocialDoPerfil: boolean,
  abaConteudo: AbaConteudoSeguindo,
): boolean {
  return Boolean(
    buscaSeguindoAberta &&
      termoBusca.length >= 2 &&
      !visualizandoListaSocialDoPerfil &&
      (abaConteudo === "pessoas" || abaConteudo === "seguidores")
  );
}
