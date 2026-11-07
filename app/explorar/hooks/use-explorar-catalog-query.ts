"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { ConsultaCatalogo, CursorCatalogo } from "../../../lib/catalogo";
import type { ObraLocal } from "../lib/explorar-work-normalizers";
import type { OrdenacaoExplorar } from "../lib/explorar-derived-utils";
import type { ModoConteudoExplorar } from "../components/explorar-section-components";
import type { ErroCatalogoExplorar } from "./use-explorar-catalog-pagination-state";
import {
  CONSULTAS_INICIAIS_CATALOGO_EXPLORAR,
  carregarObrasPublicadasSupabase,
} from "../lib/explorar-remote-loader";
import type { FiltroColecaoCatalogoExplorar } from "../lib/explorar-remote-loader";
import type { FiltroColecaoExplorar } from "../lib/explorar-derived-utils";

type OpcoesConsultaCatalogoExplorar = {
  modoConteudo: ModoConteudoExplorar;
  busca: string;
  termoBusca: string;
  categoriaSelecionada: string;
  filtroFormato: string;
  filtroTag?: string;
  filtroClassificacao: string;
  filtroCapitulos: string;
  ordenacao: OrdenacaoExplorar;
  filtroColecao: FiltroColecaoExplorar;
  obrasFavoritas: string[];
  obrasConcluidas: string[];
  obrasComLeitura: string[];
  colecoesCarregadas: boolean;
  dadosExplorarCarregados: boolean;
  obrasLocais: ObraLocal[];
  proximoCursorCatalogo: CursorCatalogo | null;
  carregandoMaisCatalogo: boolean;
  versaoRetryCatalogo: number;
  obrasCacheLocalRef: RefObject<ObraLocal[]>;
  usuarioIdExplorarRef: RefObject<string>;
  setObrasLocais: Dispatch<SetStateAction<ObraLocal[]>>;
  setProximoCursorCatalogo: Dispatch<SetStateAction<CursorCatalogo | null>>;
  setCatalogoTemMais: Dispatch<SetStateAction<boolean>>;
  setCarregandoMaisCatalogo: Dispatch<SetStateAction<boolean>>;
  setObraIdsBuscaRemota: Dispatch<SetStateAction<string[] | null>>;
  setErroCatalogoExplorar: Dispatch<SetStateAction<ErroCatalogoExplorar>>;
};

export function useExplorarCatalogQuery({
  modoConteudo,
  busca,
  termoBusca,
  categoriaSelecionada,
  filtroFormato,
  filtroTag = "",
  filtroClassificacao,
  filtroCapitulos,
  ordenacao,
  filtroColecao,
  obrasFavoritas,
  obrasConcluidas,
  obrasComLeitura,
  colecoesCarregadas,
  dadosExplorarCarregados,
  obrasLocais,
  proximoCursorCatalogo,
  carregandoMaisCatalogo,
  versaoRetryCatalogo,
  obrasCacheLocalRef,
  usuarioIdExplorarRef,
  setObrasLocais,
  setProximoCursorCatalogo,
  setCatalogoTemMais,
  setCarregandoMaisCatalogo,
  setObraIdsBuscaRemota,
  setErroCatalogoExplorar,
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
    setErroCatalogoExplorar,
  });
  const consultaCatalogoRef = useRef(0);
  const consultaPersonalizadaAtivaRef = useRef(false);
  const versaoRetryCatalogoRef = useRef(versaoRetryCatalogo);

  const buscaCatalogo = busca.trim();
  const filtroColecaoCatalogo = useMemo<FiltroColecaoCatalogoExplorar | null>(
    () => {
      if (filtroColecao === "todos") {
        return null;
      }

      const obraIds =
        filtroColecao === "favoritas"
          ? obrasFavoritas
          : filtroColecao === "concluidas"
            ? obrasConcluidas
            : obrasComLeitura;

      return { tipo: filtroColecao, obraIds };
    }, [
      filtroColecao,
      obrasFavoritas,
      obrasConcluidas,
      obrasComLeitura,
    ],
  );

  const consultaCatalogoAtual = useMemo<ConsultaCatalogo>(() => ({
    busca: buscaCatalogo,
    genero: categoriaSelecionada,
    formato: filtroFormato === "todos" ? "" : filtroFormato,
    ...(filtroTag ? { tag: filtroTag } : {}),
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
    filtroTag,
    ordenacao,
  ]);
  const consultaCatalogoPersonalizada = Boolean(
    modoConteudo === "autores" ||
      termoBusca ||
      categoriaSelecionada ||
      filtroFormato !== "todos" ||
      filtroTag ||
      filtroClassificacao !== "todos" ||
      filtroCapitulos !== "todos" ||
      ordenacao !== "relevancia" ||
      filtroColecaoCatalogo,
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
      setErroCatalogoExplorar,
    } = dependenciasEstaveisRef.current;

    if (!dadosExplorarCarregados) {
      return;
    }

    if (filtroColecaoCatalogo && !colecoesCarregadas) {
      return;
    }

    const retrySolicitado =
      versaoRetryCatalogo !== versaoRetryCatalogoRef.current;

    if (
      !consultaCatalogoPersonalizada &&
      !consultaPersonalizadaAtivaRef.current &&
      !retrySolicitado
    ) {
      return;
    }

    versaoRetryCatalogoRef.current = versaoRetryCatalogo;
    consultaPersonalizadaAtivaRef.current = consultaCatalogoPersonalizada;
    setErroCatalogoExplorar((erroAtual) =>
      erroAtual === "paginacao" ? "consulta" : erroAtual,
    );
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
          filtroColecaoCatalogo,
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
          setErroCatalogoExplorar(
            resultado.falhaTemporaria ? "consulta" : null,
          );
        }
      } catch {
        if (!cancelado && consultaCatalogoRef.current === numeroConsulta) {
          setErroCatalogoExplorar("consulta");
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
    versaoRetryCatalogo,
    filtroColecaoCatalogo,
    colecoesCarregadas,
  ]);

  async function carregarMaisObrasCatalogo() {
    const {
      usuarioIdExplorarRef,
      setObrasLocais,
      setProximoCursorCatalogo,
      setCatalogoTemMais,
      setCarregandoMaisCatalogo,
      setObraIdsBuscaRemota,
      setErroCatalogoExplorar,
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
        filtroColecaoCatalogo,
        Boolean(filtroColecaoCatalogo),
      );

      if (consultaCatalogoRef.current === numeroConsulta) {
        if (resultado.falhaTemporaria) {
          setErroCatalogoExplorar("paginacao");
          return;
        }

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
        setErroCatalogoExplorar(null);
      }
    } catch {
      if (consultaCatalogoRef.current === numeroConsulta) {
        setErroCatalogoExplorar("paginacao");
      }
    } finally {
      if (consultaCatalogoRef.current === numeroConsulta) {
        setCarregandoMaisCatalogo(false);
      }
    }
  }

  return { consultaCatalogoPersonalizada, carregarMaisObrasCatalogo };
}
