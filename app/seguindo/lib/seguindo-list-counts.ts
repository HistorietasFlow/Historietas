import type { AbaConteudoSeguindo } from "./seguindo-page-types";

export function calcularTotaisSeguindo({
  abaConteudo,
  listaSocialEhDoUsuarioLogado,
  visualizandoListaSocialDoPerfil,
  obrasSeguidasBase,
  usuariosSeguidos,
  usuariosSeguidores,
  solicitacoesSeguidores,
  autoresBase,
  usuariosFiltrados,
  solicitacoesSeguidoresFiltradas,
  obrasFiltradas,
  autoresFiltrados,
}: {
  abaConteudo: AbaConteudoSeguindo;
  listaSocialEhDoUsuarioLogado: boolean;
  visualizandoListaSocialDoPerfil: boolean;
  obrasSeguidasBase: readonly unknown[];
  usuariosSeguidos: readonly unknown[];
  usuariosSeguidores: readonly unknown[];
  solicitacoesSeguidores: readonly unknown[];
  autoresBase: readonly unknown[];
  usuariosFiltrados: readonly unknown[];
  solicitacoesSeguidoresFiltradas: readonly unknown[];
  obrasFiltradas: readonly unknown[];
  autoresFiltrados: readonly unknown[];
}) {
  const totalDisponivelGeral =
    obrasSeguidasBase.length +
    usuariosSeguidos.length +
    usuariosSeguidores.length +
    solicitacoesSeguidores.length +
    (visualizandoListaSocialDoPerfil ? 0 : autoresBase.length);

  const totalSemFiltros =
    abaConteudo === "seguidores"
      ? usuariosSeguidores.length +
        (listaSocialEhDoUsuarioLogado ? solicitacoesSeguidores.length : 0)
      : abaConteudo === "obras"
        ? obrasSeguidasBase.length
        : usuariosSeguidos.length +
          (visualizandoListaSocialDoPerfil ? 0 : autoresBase.length);

  const totalSeguindo =
    abaConteudo === "seguidores"
      ? usuariosFiltrados.length + solicitacoesSeguidoresFiltradas.length
      : abaConteudo === "obras"
        ? obrasFiltradas.length
        : usuariosFiltrados.length +
          (visualizandoListaSocialDoPerfil ? 0 : autoresFiltrados.length);
  return { totalDisponivelGeral, totalSemFiltros, totalSeguindo };
}
