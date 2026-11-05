"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { ConsultaCatalogo, CursorCatalogo } from "../../../lib/catalogo";
import type { ObraLocal } from "../lib/explorar-work-normalizers";
import type { OrdenacaoExplorar } from "../lib/explorar-derived-utils";
import {
  CONSULTAS_INICIAIS_CATALOGO_EXPLORAR,
  carregarObrasPublicadasSupabase,
} from "../lib/explorar-remote-loader";

type OpcoesConsultaCatalogoExplorar = {
  busca: string;
  termoBusca: string;
  categoriaSelecionada: string;
  filtroFormato: string;
  filtroClassificacao: string;
  filtroCapitulos: string;
  ordenacao: OrdenacaoExplorar;
  dadosExplorarCarregados: boolean;
  obrasLocais: ObraLocal[];
  proximoCursorCatalogo: CursorCatalogo | null;
  carregandoMaisCatalogo: boolean;
  obrasCacheLocalRef: RefObject<ObraLocal[]>;
  usuarioIdExplorarRef: RefObject<string>;
  setObrasLocais: Dispatch<SetStateAction<ObraLocal[]>>;
  setProximoCursorCatalogo: Dispatch<SetStateAction<CursorCatalogo | null>>;
  setCatalogoTemMais: Dispatch<SetStateAction<boolean>>;
  setCarregandoMaisCatalogo: Dispatch<SetStateAction<boolean>>;
  setObraIdsBuscaRemota: Dispatch<SetStateAction<string[] | null>>;
};

export function useExplorarCatalogQuery({
  busca,
  termoBusca,
  categoriaSelecionada,
  filtroFormato,
  filtroClassificacao,
  filtroCapitulos,
  ordenacao,
  dadosExplorarCarregados,
  obrasLocais,
  proximoCursorCatalogo,
  carregandoMaisCatalogo,
  obrasCacheLocalRef,
  usuarioIdExplorarRef,
  setObrasLocais,
  setProximoCursorCatalogo,
  setCatalogoTemMais,
  setCarregandoMaisCatalogo,
  setObraIdsBuscaRemota,
}: OpcoesConsultaCatalogoExplorar) {
  // Os setters e refs da página são estáveis durante seu ciclo de vida.
  const dependenciasEstaveisRef = useRef({
    obrasCacheLocalRef,
    usuarioIdExplorarRef,
    setObrasLocais,
    setProximoCursorCatalogo,
    setCatalogoTemMais,
    setCarregandoMaisCatalogo,
    setObraIdsBuscaRemota,
  });
  const consultaCatalogoRef = useRef(0);
  const consultaPersonalizadaAtivaRef = useRef(false);

  const buscaCatalogo = busca.trim();

  const consultaCatalogoAtual = useMemo<ConsultaCatalogo>(() => ({
    busca: buscaCatalogo,
    genero: categoriaSelecionada,
    formato: filtroFormato === "todos" ? "" : filtroFormato,
    classificacao:
      filtroClassificacao === "todos" ? "" : filtroClassificacao,
    filtroCapitulos:
      filtroCapitulos === "com-capitulos" ||
      filtroCapitulos === "sem-capitulos"
        ? filtroCapitulos
        : "todos",
    ordenacao,
    limite: 24,
  }), [
    buscaCatalogo,
    categoriaSelecionada,
    filtroCapitulos,
    filtroClassificacao,
    filtroFormato,
    ordenacao,
  ]);
  const consultaCatalogoPersonalizada = Boolean(
    termoBusca ||
      categoriaSelecionada ||
      filtroFormato !== "todos" ||
      filtroClassificacao !== "todos" ||
      filtroCapitulos !== "todos" ||
      ordenacao !== "relevancia",
  );

  useEffect(() => {
    const {
      obrasCacheLocalRef,
      usuarioIdExplorarRef,
      setObrasLocais,
      setProximoCursorCatalogo,
      setCatalogoTemMais,
      setCarregandoMaisCatalogo,
      setObraIdsBuscaRemota,
    } = dependenciasEstaveisRef.current;

    if (!dadosExplorarCarregados) {
      return;
    }

    if (
      !consultaCatalogoPersonalizada &&
      !consultaPersonalizadaAtivaRef.current
    ) {
      return;
    }

    consultaPersonalizadaAtivaRef.current = consultaCatalogoPersonalizada;
    setObraIdsBuscaRemota(null);
    const numeroConsulta = consultaCatalogoRef.current + 1;
    consultaCatalogoRef.current = numeroConsulta;
    let cancelado = false;
    const timer = window.setTimeout(async () => {
      setCarregandoMaisCatalogo(true);

      try {
        const consultas = consultaCatalogoPersonalizada
          ? [consultaCatalogoAtual]
          : CONSULTAS_INICIAIS_CATALOGO_EXPLORAR;
        const resultado = await carregarObrasPublicadasSupabase(
          obrasCacheLocalRef.current,
          usuarioIdExplorarRef.current,
          consultas,
        );

        if (!cancelado && consultaCatalogoRef.current === numeroConsulta) {
          setObrasLocais(resultado.obras);
          setObraIdsBuscaRemota(
            termoBusca && resultado.pagina
              ? [...resultado.pagina.obraIds]
              : null,
          );
          setProximoCursorCatalogo(
            resultado.pagina?.proximoCursor || null,
          );
          setCatalogoTemMais(Boolean(resultado.pagina?.temMais));
        }
      } finally {
        if (!cancelado && consultaCatalogoRef.current === numeroConsulta) {
          setCarregandoMaisCatalogo(false);
        }
      }
    }, 350);

    return () => {
      cancelado = true;
      window.clearTimeout(timer);
    };
  }, [
    consultaCatalogoAtual,
    consultaCatalogoPersonalizada,
    dadosExplorarCarregados,
    termoBusca,
  ]);

  async function carregarMaisObrasCatalogo() {
    const {
      usuarioIdExplorarRef,
      setObrasLocais,
      setProximoCursorCatalogo,
      setCatalogoTemMais,
      setCarregandoMaisCatalogo,
      setObraIdsBuscaRemota,
    } = dependenciasEstaveisRef.current;

    if (
      !consultaCatalogoPersonalizada ||
      !proximoCursorCatalogo ||
      carregandoMaisCatalogo
    ) {
      return;
    }

    const numeroConsulta = consultaCatalogoRef.current + 1;
    consultaCatalogoRef.current = numeroConsulta;
    setCarregandoMaisCatalogo(true);

    try {
      const resultado = await carregarObrasPublicadasSupabase(
        obrasLocais,
        usuarioIdExplorarRef.current,
        [{ ...consultaCatalogoAtual, cursor: proximoCursorCatalogo }],
      );

      if (consultaCatalogoRef.current === numeroConsulta) {
        setObrasLocais(resultado.obras);
        const pagina = resultado.pagina;
        if (termoBusca && pagina) {
          setObraIdsBuscaRemota((obraIdsAtuais) =>
            Array.from(
              new Set([
                ...(obraIdsAtuais || []),
                ...pagina.obraIds,
              ]),
            ),
          );
        }
        setProximoCursorCatalogo(resultado.pagina?.proximoCursor || null);
        setCatalogoTemMais(Boolean(resultado.pagina?.temMais));
      }
    } finally {
      if (consultaCatalogoRef.current === numeroConsulta) {
        setCarregandoMaisCatalogo(false);
      }
    }
  }

  return { consultaCatalogoPersonalizada, carregarMaisObrasCatalogo };
}
