import type { AbaConteudoSeguindo } from "./seguindo-page-types";

export function obterPermissoesListaSocial(
  listaSocialEhDoUsuarioLogado: boolean,
  abaConteudo: AbaConteudoSeguindo,
) {
  return {
    podeRemoverUsuariosDaLista:
      listaSocialEhDoUsuarioLogado && abaConteudo === "pessoas",
    podeRemoverSeguidoresDaLista:
      listaSocialEhDoUsuarioLogado && abaConteudo === "seguidores",
  };
}
