"use client";

import { useMemo } from "react";
import type { AbaConteudoSeguindo, FiltroSeguindo, OrdenacaoSeguindo, UsuarioSeguido } from "../lib/seguindo-page-types";
import { filtrarUsuariosSeguindo } from "../lib/seguindo-filtered-users";

export function useSeguindoFilteredUsers(
  usuariosBaseSocial: UsuarioSeguido[],
  termoBusca: string,
  filtro: FiltroSeguindo,
  ordenacao: OrdenacaoSeguindo,
  abaConteudo: AbaConteudoSeguindo,
  visualizandoListaSocialDoPerfil: boolean,
): UsuarioSeguido[] {
  const usuariosFiltrados = useMemo<UsuarioSeguido[]>(
    () => filtrarUsuariosSeguindo(
      usuariosBaseSocial, termoBusca, filtro, ordenacao, abaConteudo, visualizandoListaSocialDoPerfil,
    ),
    [usuariosBaseSocial, termoBusca, filtro, ordenacao, abaConteudo, visualizandoListaSocialDoPerfil],
  );
  return usuariosFiltrados;
}
