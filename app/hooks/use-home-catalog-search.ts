"use client";

import { useEffect, useRef } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { ConsultaCatalogo } from "../../lib/catalogo";
import {
  carregarObrasSupabaseHome,
  CONSULTAS_INICIAIS_CATALOGO_HOME,
} from "../lib/home-supabase-works-loader";

type ObrasLocaisHome = Awaited<ReturnType<typeof carregarObrasSupabaseHome>>;

type UseHomeCatalogSearchParams = {
  dadosHomeCarregados: boolean;
  termoBusca: string;
  usuarioIdLogado: string;
  obrasCacheLocalHomeRef: MutableRefObject<ObrasLocaisHome>;
  setObrasLocais: Dispatch<SetStateAction<ObrasLocaisHome>>;
};

export default function useHomeCatalogSearch({
  dadosHomeCarregados,
  termoBusca,
  usuarioIdLogado,
  obrasCacheLocalHomeRef,
  setObrasLocais,
}: UseHomeCatalogSearchParams) {
  const consultaCatalogoHomeRef = useRef(0);
  const buscaCatalogoHomeAtivaRef = useRef(false);

  useEffect(() => {
    if (!dadosHomeCarregados) {
      return;
    }

    const buscaAtiva = Boolean(termoBusca);

    if (!buscaAtiva && !buscaCatalogoHomeAtivaRef.current) {
      return;
    }

    buscaCatalogoHomeAtivaRef.current = buscaAtiva;
    const numeroConsulta = consultaCatalogoHomeRef.current + 1;
    consultaCatalogoHomeRef.current = numeroConsulta;
    let cancelado = false;
    const timer = window.setTimeout(async () => {
      const consultas = buscaAtiva
        ? ([
            {
              busca: termoBusca,
              ordenacao: "relevancia",
              limite: 50,
            },
          ] satisfies readonly ConsultaCatalogo[])
        : CONSULTAS_INICIAIS_CATALOGO_HOME;
      const obras = await carregarObrasSupabaseHome(
        obrasCacheLocalHomeRef.current,
        usuarioIdLogado,
        consultas,
      );

      if (!cancelado && consultaCatalogoHomeRef.current === numeroConsulta) {
        setObrasLocais(obras);
      }
    }, 350);

    return () => {
      cancelado = true;
      window.clearTimeout(timer);
    };
    // setObrasLocais é estável e o lifecycle de busca mantém suas dependências originais.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dadosHomeCarregados, termoBusca, usuarioIdLogado]);
}
