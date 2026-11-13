"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  tagExcluida?: string;
  generoExcluido?: string;
  statusEditorial?: string;
  notaMinima?: number | null;
  usuarioIdExplorar?: string;
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
  tagExcluida = "",
  generoExcluido = "",
  statusEditorial = "",
  notaMinima = null,
  usuarioIdExplorar = "",
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
  const [consultaFiltrosConfirmada, setConsultaFiltrosConfirmada] = useState<{
    consulta: ConsultaCatalogo; usuarioId: string;
  } | null>(null);
  // Cache não comprova nota nem ausência de tag/gênero; confirme a consulta/identidade atuais.
  const exigeConfirmacao = notaMinima !== null || (modoConteudo === "obras" && Boolean(tagExcluida || generoExcluido || statusEditorial));
  const identidadeConsultaFiltros = exigeConfirmacao ? usuarioIdExplorar : "";

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
    ...(modoConteudo === "obras" && tagExcluida ? { tagExcluida } : {}),
    ...(modoConteudo === "obras" && generoExcluido ? { generoExcluido } : {}),
    ...(modoConteudo === "obras" && statusEditorial ? { statusEditorial } : {}),
    ...(notaMinima !== null ? { notaMinima } : {}),
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
    tagExcluida,
    generoExcluido,
    statusEditorial,
    modoConteudo,
    notaMinima,
    ordenacao,
  ]);
  const consultaCatalogoPersonalizada = Boolean(
    modoConteudo === "autores" ||
      termoBusca ||
      categoriaSelecionada ||
      filtroFormato !== "todos" ||
      filtroTag ||
      (modoConteudo === "obras" && (tagExcluida || generoExcluido || statusEditorial)) ||
      notaMinima !== null ||
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
          setConsultaFiltrosConfirmada(exigeConfirmacao && resultado.pagina && !resultado.falhaTemporaria
            ? { consulta: consultaCatalogoAtual, usuarioId: identidadeConsultaFiltros } : null);
          setObrasLocais(resultado.obras);
          setObraIdsBuscaRemota(
            (termoBusca || exigeConfirmacao) && resultado.pagina && (!exigeConfirmacao || !resultado.falhaTemporaria)
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
          setConsultaFiltrosConfirmada(null);
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
    identidadeConsultaFiltros,
    exigeConfirmacao,
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
        if ((termoBusca || exigeConfirmacao) && pagina) {
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

  return { consultaCatalogoPersonalizada, carregarMaisObrasCatalogo,
    statusEditorialVerificado: !statusEditorial || modoConteudo !== "obras" || Boolean(
      consultaFiltrosConfirmada?.consulta === consultaCatalogoAtual &&
      consultaFiltrosConfirmada.usuarioId === identidadeConsultaFiltros
    ),
    notaMinimaVerificada: notaMinima === null || (
      consultaFiltrosConfirmada?.consulta === consultaCatalogoAtual &&
      consultaFiltrosConfirmada.usuarioId === identidadeConsultaFiltros
    ),
    generoExcluidoVerificado: !generoExcluido || modoConteudo !== "obras" || Boolean(
      consultaFiltrosConfirmada?.consulta === consultaCatalogoAtual &&
      consultaFiltrosConfirmada.usuarioId === identidadeConsultaFiltros
    ),
    tagExcluidaVerificada: !tagExcluida || modoConteudo !== "obras" || (
      consultaFiltrosConfirmada?.consulta === consultaCatalogoAtual &&
      consultaFiltrosConfirmada.usuarioId === identidadeConsultaFiltros
    ) };
}
