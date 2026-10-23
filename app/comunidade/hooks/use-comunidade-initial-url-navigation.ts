"use client";

import { useEffect, useRef } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { obterGrupoPublicacaoObraPorParametro } from "../components/community-publication-group-parameter";
import type { GrupoPublicacaoObra } from "../components/community-publication-group";
import type { TipoPublicacaoFiltro } from "../components/community-publication-filter";
import { obterTipoPublicacaoPorParametro } from "../components/community-publication-type-parameter";
import type { AbaFeedComunidade } from "../components/community-feed-tab";
import type { OrdenacaoComunidade } from "../components/community-sort-order";
import type { PostComunidade } from "../components/community-post-model";
import {
  obterParametroBuscaComunidade,
  obterParametroObraComunidade,
  obterParametroPostComunidade,
} from "../components/community-url-parameters";

type UseComunidadeInitialUrlNavigationOptions = {
  carregarPostsComunidadeNoEfeito: (
    mostrarCarregamento: boolean,
    pagina: number,
    obraFiltro: string,
  ) => void;
  comentarioUrlAplicadoRef: RefObject<boolean>;
  comentariosPostId: string | null;
  posts: PostComunidade[];
  setTermoBusca: Dispatch<SetStateAction<string>>;
  setObraRelacionadaFiltro: Dispatch<SetStateAction<string>>;
  setGrupoPublicacaoObra: Dispatch<SetStateAction<GrupoPublicacaoObra>>;
  setTipoPublicacaoAtiva: Dispatch<SetStateAction<TipoPublicacaoFiltro>>;
  setAbaFeedAtiva: Dispatch<SetStateAction<AbaFeedComunidade>>;
  setMenuAcoesRapidasComunidadeAberto: Dispatch<SetStateAction<boolean>>;
  setMostrarApenasSalvos: Dispatch<SetStateAction<boolean>>;
  setOrdenacaoAtiva: Dispatch<SetStateAction<OrdenacaoComunidade>>;
  setComentariosPostId: Dispatch<SetStateAction<string | null>>;
};

export function useComunidadeInitialUrlNavigation({
  carregarPostsComunidadeNoEfeito,
  comentarioUrlAplicadoRef,
  comentariosPostId,
  posts,
  setTermoBusca,
  setObraRelacionadaFiltro,
  setGrupoPublicacaoObra,
  setTipoPublicacaoAtiva,
  setAbaFeedAtiva,
  setMenuAcoesRapidasComunidadeAberto,
  setMostrarApenasSalvos,
  setOrdenacaoAtiva,
  setComentariosPostId,
}: UseComunidadeInitialUrlNavigationOptions) {
  const parametrosComunidadeAplicadosRef = useRef(false);

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

  useEffect(() => {
    if (parametrosComunidadeAplicadosRef.current) {
      return;
    }

    parametrosComunidadeAplicadosRef.current = true;

    const parametrosUrl = new URLSearchParams(window.location.search);
    const buscaUrl = obterParametroBuscaComunidade(parametrosUrl);
    const obraUrl = obterParametroObraComunidade(parametrosUrl);
    const tipoUrl = obterTipoPublicacaoPorParametro(
      parametrosUrl.get("tipo") || ""
    );
    const grupoObraUrl = obterGrupoPublicacaoObraPorParametro(
      parametrosUrl.get("grupo") || ""
    );

    if (!buscaUrl && !obraUrl && !tipoUrl && !grupoObraUrl) {
      return;
    }

    const aplicarParametrosTimer = window.setTimeout(() => {
      if (buscaUrl) {
        setTermoBusca(buscaUrl.slice(0, 90));
      }

      setObraRelacionadaFiltro(obraUrl);
      setGrupoPublicacaoObra(tipoUrl ? "" : grupoObraUrl);

      if (tipoUrl) {
        setTipoPublicacaoAtiva(tipoUrl);
        setAbaFeedAtiva(
          tipoUrl === "Teoria"
            ? "Teorias"
            : tipoUrl === "Review"
              ? "Reviews"
              : "Recentes"
        );
        setMenuAcoesRapidasComunidadeAberto(true);
      } else if (grupoObraUrl) {
        setTipoPublicacaoAtiva("Todos");
      }

      setMostrarApenasSalvos(false);
      setOrdenacaoAtiva("Recentes");
    }, 0);

    return () => {
      window.clearTimeout(aplicarParametrosTimer);
    };
  }, []);

  useEffect(() => {
    if (comentarioUrlAplicadoRef.current || comentariosPostId || posts.length === 0) {
      return;
    }

    const postIdUrl = obterParametroPostComunidade(
      new URLSearchParams(window.location.search)
    );

    if (postIdUrl && posts.some((post) => post.id === postIdUrl)) {
      comentarioUrlAplicadoRef.current = true;

      const abrirComentariosTimer = window.setTimeout(() => {
        setComentariosPostId(postIdUrl);
      }, 0);

      return () => {
        window.clearTimeout(abrirComentariosTimer);
      };
    }
  }, [comentariosPostId, posts]);
}
