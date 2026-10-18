"use client";

import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";

type AbaConteudoSeguindo = "seguidores" | "obras" | "pessoas";
type AbaSeguimentoPagina = "seguidores" | "seguindo";
type FiltroSeguindo =
  | "todos"
  | "obras"
  | "autores"
  | "usuarios"
  | "em-leitura"
  | "favoritas"
  | "concluidas";
type OrdenacaoSeguindo =
  | "padrao"
  | "recentes"
  | "antigos"
  | "titulo"
  | "progresso"
  | "capitulos";

type UseSeguindoContentTabNavigationParams = {
  perfilSocialId: string;
  perfilSocialNome: string;
  usuarioLogadoId: string;
  visualizandoListaSocialDoPerfil: boolean;
  setAbaConteudo: Dispatch<SetStateAction<AbaConteudoSeguindo>>;
  setAbaSeguimento: Dispatch<SetStateAction<AbaSeguimentoPagina>>;
  setBusca: Dispatch<SetStateAction<string>>;
  setFiltro: Dispatch<SetStateAction<FiltroSeguindo>>;
  setOrdenacao: Dispatch<SetStateAction<OrdenacaoSeguindo>>;
};

export function useSeguindoContentTabNavigation({
  perfilSocialId,
  perfilSocialNome,
  usuarioLogadoId,
  visualizandoListaSocialDoPerfil,
  setAbaConteudo,
  setAbaSeguimento,
  setBusca,
  setFiltro,
  setOrdenacao,
}: UseSeguindoContentTabNavigationParams) {
  return useCallback(
    (novaAba: AbaConteudoSeguindo) => {
      setAbaConteudo(novaAba);
      setAbaSeguimento(
        novaAba === "seguidores" ? "seguidores" : "seguindo",
      );
      setBusca("");
      setFiltro(novaAba === "obras" ? "todos" : "usuarios");
      setOrdenacao("padrao");

      if (typeof window === "undefined") {
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const perfilIdParaUrl = perfilSocialId || usuarioLogadoId;

      params.set("conteudo", novaAba);

      if (novaAba === "seguidores") {
        params.set("aba", "seguidores");
      } else if (novaAba === "pessoas") {
        params.set("aba", "seguindo");
      } else {
        params.delete("aba");
      }

      if (perfilIdParaUrl && visualizandoListaSocialDoPerfil) {
        params.set("userId", perfilIdParaUrl);
        params.set("autorId", perfilIdParaUrl);
      }

      if (perfilSocialNome.trim()) {
        params.set("autor", perfilSocialNome.trim());
      }

      window.history.replaceState(
        null,
        "",
        `/seguindo?${params.toString()}`,
      );
    },
    [
      perfilSocialId,
      perfilSocialNome,
      setAbaConteudo,
      setAbaSeguimento,
      setBusca,
      setFiltro,
      setOrdenacao,
      usuarioLogadoId,
      visualizandoListaSocialDoPerfil,
    ],
  );
}
