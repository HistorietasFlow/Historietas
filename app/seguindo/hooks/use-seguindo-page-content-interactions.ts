"use client";

import type { Dispatch, SetStateAction } from "react";
import { useSeguindoContentTabNavigation } from "./use-seguindo-content-tab-navigation";
import { useSeguindoUserSearchSync } from "./use-seguindo-user-search-sync";
import type {
  AbaConteudoSeguindo,
  AbaSeguimentoPagina,
  FiltroSeguindo,
  OrdenacaoSeguindo,
  UsuarioSeguido,
} from "../lib/seguindo-page-types";

type UseSeguindoPageContentInteractionsParams = {
  perfilSocialId: string;
  perfilSocialNome: string;
  usuarioLogadoId: string;
  visualizandoListaSocialDoPerfil: boolean;
  setAbaConteudo: Dispatch<SetStateAction<AbaConteudoSeguindo>>;
  setAbaSeguimento: Dispatch<SetStateAction<AbaSeguimentoPagina>>;
  busca: string;
  setBusca: Dispatch<SetStateAction<string>>;
  setFiltro: Dispatch<SetStateAction<FiltroSeguindo>>;
  setOrdenacao: Dispatch<SetStateAction<OrdenacaoSeguindo>>;
  buscaSugestoesUsuariosAtiva: boolean;
  usuariosSeguidos: UsuarioSeguido[];
  setUsuariosSugestoesBusca: Dispatch<SetStateAction<UsuarioSeguido[]>>;
  setCarregandoUsuariosSugestoes: Dispatch<SetStateAction<boolean>>;
};

export function useSeguindoPageContentInteractions({
  perfilSocialId,
  perfilSocialNome,
  usuarioLogadoId,
  visualizandoListaSocialDoPerfil,
  setAbaConteudo,
  setAbaSeguimento,
  busca,
  setBusca,
  setFiltro,
  setOrdenacao,
  buscaSugestoesUsuariosAtiva,
  usuariosSeguidos,
  setUsuariosSugestoesBusca,
  setCarregandoUsuariosSugestoes,
}: UseSeguindoPageContentInteractionsParams) {
  const trocarAbaConteudo = useSeguindoContentTabNavigation({
    perfilSocialId,
    perfilSocialNome,
    usuarioLogadoId,
    visualizandoListaSocialDoPerfil,
    setAbaConteudo,
    setAbaSeguimento,
    setBusca,
    setFiltro,
    setOrdenacao,
  });

  useSeguindoUserSearchSync({
    busca,
    buscaSugestoesUsuariosAtiva,
    usuarioLogadoId,
    usuariosSeguidos,
    setUsuariosSugestoesBusca,
    setCarregandoUsuariosSugestoes,
  });

  return trocarAbaConteudo;
}
