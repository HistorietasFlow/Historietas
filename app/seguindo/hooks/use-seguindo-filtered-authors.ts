"use client";

import { useMemo } from "react";
import type { AbaConteudoSeguindo, AutorSeguido, FiltroSeguindo, OrdenacaoSeguindo } from "../lib/seguindo-page-types";
import { filtrarAutoresSeguindo } from "../lib/seguindo-filtered-authors";

export function useSeguindoFilteredAuthors(
  autoresBase: AutorSeguido[],
  termoBusca: string,
  filtro: FiltroSeguindo,
  ordenacao: OrdenacaoSeguindo,
  abaConteudo: AbaConteudoSeguindo,
  visualizandoListaSocialDoPerfil: boolean,
): AutorSeguido[] {
  const autoresFiltrados = useMemo<AutorSeguido[]>(
    () => filtrarAutoresSeguindo(
      autoresBase, termoBusca, filtro, ordenacao, abaConteudo, visualizandoListaSocialDoPerfil,
    ),
    [autoresBase, termoBusca, filtro, ordenacao, abaConteudo, visualizandoListaSocialDoPerfil],
  );
  return autoresFiltrados;
}
