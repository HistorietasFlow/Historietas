"use client";

import { useEffect, useEffectEvent } from "react";
import type { Dispatch, SetStateAction } from "react";
import { carregarMaisPostsComunidade } from "../components/community-more-posts-loader";
import { carregarPostsComunidade } from "../components/community-posts-loader";
import type { PostComunidade } from "../components/community-post-model";
import type { ObraRelacionadaSugestao } from "../components/community-related-work-suggestion";
import { obterParametroObraComunidade } from "../components/community-url-parameters";

type SetState<T> = Dispatch<SetStateAction<T>>;

type UseComunidadeFeedLifecycleOptions = {
  obraRelacionadaFiltro: string;
  carregandoFeed: boolean;
  carregandoMaisPostsComunidade: boolean;
  temMaisPostsComunidade: boolean;
  paginaFeedComunidade: number;
  setCarregandoFeed: SetState<boolean>;
  setCarregandoMaisPostsComunidade: SetState<boolean>;
  setPosts: SetState<PostComunidade[]>;
  setTemMaisPostsComunidade: SetState<boolean>;
  setPaginaFeedComunidade: SetState<number>;
  setObrasRelacionadasSugestoes: SetState<ObraRelacionadaSugestao[]>;
  setErro: SetState<string>;
};

export function useComunidadeFeedLifecycle({
  obraRelacionadaFiltro,
  carregandoFeed,
  carregandoMaisPostsComunidade,
  temMaisPostsComunidade,
  paginaFeedComunidade,
  setCarregandoFeed,
  setCarregandoMaisPostsComunidade,
  setPosts,
  setTemMaisPostsComunidade,
  setPaginaFeedComunidade,
  setObrasRelacionadasSugestoes,
  setErro,
}: UseComunidadeFeedLifecycleOptions) {
  function carregarPostsComunidadeDaPagina(
    mostrarCarregamento = false,
    pagina = 0,
    obraFiltro = obraRelacionadaFiltro,
  ) {
    return carregarPostsComunidade({
      mostrarCarregamento,
      pagina,
      obraFiltro,
      setCarregandoFeed,
      setCarregandoMaisPostsComunidade,
      setPosts,
      setTemMaisPostsComunidade,
      setPaginaFeedComunidade,
      setObrasRelacionadasSugestoes,
      setErro,
    });
  }

  const carregarPostsComunidadeNoEfeito = useEffectEvent(
    (mostrarCarregamento: boolean, pagina: number, obraFiltro: string) =>
      carregarPostsComunidadeDaPagina(mostrarCarregamento, pagina, obraFiltro),
  );

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    const parametrosUrl = new URLSearchParams(window.location.search);
    const obraUrl = obterParametroObraComunidade(parametrosUrl);

    const carregarFeedTimer = window.setTimeout(() => {
      void carregarPostsComunidadeNoEfeito(true, 0, obraUrl);
    }, 0);

    return () => {
      window.clearTimeout(carregarFeedTimer);
    };
  }, []);

  function carregarMaisPostsComunidadeDaPagina() {
    return carregarMaisPostsComunidade({
      carregandoFeed,
      carregandoMaisPostsComunidade,
      temMaisPostsComunidade,
      paginaFeedComunidade,
      carregarPostsComunidadeDaPagina,
    });
  }

  return {
    carregarPostsComunidadeDaPagina,
    carregarMaisPostsComunidadeDaPagina,
  };
}
