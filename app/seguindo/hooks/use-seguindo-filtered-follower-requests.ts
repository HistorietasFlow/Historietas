"use client";

import { useMemo } from "react";
import type { AbaConteudoSeguindo, SolicitacaoSeguidor } from "../lib/seguindo-page-types";
import { filtrarSolicitacoesSeguidores } from "../lib/seguindo-filtered-follower-requests";

export function useSeguindoFilteredFollowerRequests(
  abaConteudo: AbaConteudoSeguindo,
  listaSocialEhDoUsuarioLogado: boolean,
  solicitacoesSeguidores: SolicitacaoSeguidor[],
  termoBusca: string,
): SolicitacaoSeguidor[] {
  const solicitacoesSeguidoresFiltradas = useMemo(
    () => filtrarSolicitacoesSeguidores(
      abaConteudo, listaSocialEhDoUsuarioLogado, solicitacoesSeguidores, termoBusca,
    ),
    [abaConteudo, listaSocialEhDoUsuarioLogado, solicitacoesSeguidores, termoBusca],
  );
  return solicitacoesSeguidoresFiltradas;
}
