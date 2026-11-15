"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { validarIntervaloPalavras } from "../../../lib/catalogo-palavras";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { ConsultaCatalogo, CursorCatalogo } from "../../../lib/catalogo";
import type { ObraLocal } from "../lib/explorar-work-normalizers";
import type { OrdenacaoExplorar } from "../lib/explorar-derived-utils";
import type { ModoConteudoExplorar } from "../components/explorar-section-components";
import type { ErroCatalogoExplorar } from "./use-explorar-catalog-pagination-state";
import {
  CONSULTAS_INICIAIS_CATALOGO_EXPLORAR,
  carregarObrasPublicadasSupabase,
  STORAGE_KEY,
} from "../lib/explorar-remote-loader";
import type { FiltroColecaoCatalogoExplorar } from "../lib/explorar-remote-loader";
import type { FiltroColecaoExplorar } from "../lib/explorar-derived-utils";
import { normalizarObra } from "../lib/explorar-work-normalizers";
import { lerStorageUsuarioExplorar, obterArquivoObraComBackup } from "../lib/explorar-local-storage";

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
  palavrasMinimas?: string;
  palavrasMaximas?: string;
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
  palavrasMinimas = "",
  palavrasMaximas = "",
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
  const carregamentoEmAndamentoRef = useRef(false);
  const paginaConfirmadaRef = useRef<{
    consulta: ConsultaCatalogo;
    colecao: FiltroColecaoCatalogoExplorar | null;
    usuarioId: string;
    cursor: CursorCatalogo | null;
  } | null>(null);
  const usuarioConsultaRef = useRef<string | null>(null);
  const consultaPersonalizadaAtivaRef = useRef(false);
  const versaoRetryCatalogoRef = useRef(versaoRetryCatalogo);
  const [consultaFiltrosConfirmada, setConsultaFiltrosConfirmada] = useState<{
    consulta: ConsultaCatalogo; usuarioId: string;
    colecao: FiltroColecaoCatalogoExplorar | null; retry: number;
  } | null>(null);
  // Cache não comprova nota nem ausência de tag/gênero; confirme a consulta/identidade atuais.
  const palavrasAtivas = modoConteudo === "obras" && (palavrasMinimas !== "" || palavrasMaximas !== "");
  const intervalo = validarIntervaloPalavras({ minimo: palavrasMinimas, maximo: palavrasMaximas });
  const intervaloInvalido = palavrasAtivas && !intervalo.valido;
  const minimo = palavrasAtivas && intervalo.valido ? intervalo.palavrasMinimas : null;
  const maximo = palavrasAtivas && intervalo.valido ? intervalo.palavrasMaximas : null;
  const exigeConfirmacao = palavrasAtivas || notaMinima !== null || (modoConteudo === "obras" && Boolean(tagExcluida || generoExcluido || statusEditorial));

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
    ...(palavrasAtivas ? { palavrasMinimas: minimo, palavrasMaximas: maximo } : {}),
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
    palavrasAtivas,
    minimo,
    maximo,
  ]);
  const consultaCatalogoPersonalizada = Boolean(
    modoConteudo === "autores" ||
      palavrasAtivas ||
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

    const identidadeAlterada = usuarioConsultaRef.current !== null &&
      usuarioConsultaRef.current !== usuarioIdExplorar;
    if (identidadeAlterada) {
      // Nunca mesclar nem persistir o cache da conta anterior na nova consulta.
      let obrasDaIdentidade: ObraLocal[] = [];
      try {
        const texto = lerStorageUsuarioExplorar(STORAGE_KEY, usuarioIdExplorar);
        const salvas: unknown = texto ? JSON.parse(texto) : [];
        if (Array.isArray(salvas)) {
          obrasDaIdentidade = salvas.map((obra, index) =>
            normalizarObra(obra, index, usuarioIdExplorar, obterArquivoObraComBackup));
        }
      } catch {
        // Cache inválido não autoriza reutilizar dados de outra conta.
      }
      obrasCacheLocalRef.current = obrasDaIdentidade;
      setObrasLocais(obrasDaIdentidade);
    }

    if (!dadosExplorarCarregados || (filtroColecaoCatalogo && !colecoesCarregadas)) {
      paginaConfirmadaRef.current = null;
      setProximoCursorCatalogo(null);
      setCatalogoTemMais(false);
      setCarregandoMaisCatalogo(false);
      setObraIdsBuscaRemota(null);
      return;
    }

    const retrySolicitado =
      versaoRetryCatalogo !== versaoRetryCatalogoRef.current;
    usuarioConsultaRef.current = usuarioIdExplorar;

    if (
      !consultaCatalogoPersonalizada &&
      !consultaPersonalizadaAtivaRef.current &&
      !retrySolicitado && !identidadeAlterada
    ) {
      return;
    }

    versaoRetryCatalogoRef.current = versaoRetryCatalogo;
    consultaPersonalizadaAtivaRef.current = consultaCatalogoPersonalizada;
    paginaConfirmadaRef.current = null;
    setConsultaFiltrosConfirmada(null);
    setErroCatalogoExplorar((erroAtual) =>
      erroAtual === "paginacao" ? "consulta" : erroAtual,
    );
    setObraIdsBuscaRemota(null);
    const numeroConsulta = consultaCatalogoRef.current + 1;
    consultaCatalogoRef.current = numeroConsulta;
    setProximoCursorCatalogo(null);
    setCatalogoTemMais(false);
    if (intervaloInvalido) {
      setCarregandoMaisCatalogo(false);
      return;
    }
    let cancelado = false;
    const usuarioId = usuarioIdExplorar;
    const consultaVigente = () => !cancelado &&
      consultaCatalogoRef.current === numeroConsulta &&
      usuarioIdExplorarRef.current === usuarioId;
    // Bloqueia paginação também durante o debounce, antes do próximo render.
    carregamentoEmAndamentoRef.current = true;
    setCarregandoMaisCatalogo(true);
    const timer = window.setTimeout(async () => {
      try {
        const consultas = consultaCatalogoPersonalizada
          ? [consultaCatalogoAtual]
          : CONSULTAS_INICIAIS_CATALOGO_EXPLORAR;
        const resultado = await carregarObrasPublicadasSupabase(
          obrasCacheLocalRef.current,
          usuarioId,
          consultas,
          filtroColecaoCatalogo,
          false,
          consultaVigente,
        );

        if (consultaVigente()) {
          paginaConfirmadaRef.current = resultado.pagina && !resultado.falhaTemporaria
            ? { consulta: consultaCatalogoAtual, colecao: filtroColecaoCatalogo,
                usuarioId, cursor: resultado.pagina.proximoCursor } : null;
          setConsultaFiltrosConfirmada(exigeConfirmacao && resultado.pagina && !resultado.falhaTemporaria
            ? { consulta: consultaCatalogoAtual, usuarioId: usuarioIdExplorar,
                colecao: filtroColecaoCatalogo, retry: versaoRetryCatalogo } : null);
          setObrasLocais(resultado.obras);
          setObraIdsBuscaRemota(
            (termoBusca || exigeConfirmacao) && resultado.pagina && (!exigeConfirmacao || !resultado.falhaTemporaria)
              ? [...resultado.pagina.obraIds]
              : null,
          );
          setProximoCursorCatalogo(paginaConfirmadaRef.current?.cursor || null);
          setCatalogoTemMais(Boolean(paginaConfirmadaRef.current && resultado.pagina?.temMais));
          setErroCatalogoExplorar(
            resultado.falhaTemporaria ? "consulta" : null,
          );
        }
      } catch {
        if (consultaVigente()) {
          setConsultaFiltrosConfirmada(null);
          setErroCatalogoExplorar("consulta");
        }
      } finally {
        if (consultaVigente()) {
          carregamentoEmAndamentoRef.current = false;
          setCarregandoMaisCatalogo(false);
        }
      }
    }, 350);

    return () => {
      cancelado = true;
      // O cleanup invalida também uma página iniciada depois da consulta inicial.
      consultaCatalogoRef.current += 1;
      paginaConfirmadaRef.current = null;
      carregamentoEmAndamentoRef.current = false;
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
    usuarioIdExplorar,
    exigeConfirmacao,
    intervaloInvalido,
    palavrasAtivas,
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

    const paginaConfirmada = paginaConfirmadaRef.current;
    if (
      !consultaCatalogoPersonalizada ||
      intervaloInvalido ||
      !dadosExplorarCarregados ||
      (filtroColecaoCatalogo && !colecoesCarregadas) ||
      !paginaConfirmada ||
      paginaConfirmada.consulta !== consultaCatalogoAtual ||
      paginaConfirmada.colecao !== filtroColecaoCatalogo ||
      paginaConfirmada.usuarioId !== usuarioIdExplorar ||
      usuarioIdExplorarRef.current !== usuarioIdExplorar ||
      paginaConfirmada.cursor !== proximoCursorCatalogo ||
      !proximoCursorCatalogo ||
      carregamentoEmAndamentoRef.current ||
      carregandoMaisCatalogo
    ) {
      return;
    }

    const numeroConsulta = consultaCatalogoRef.current + 1;
    consultaCatalogoRef.current = numeroConsulta;
    const usuarioId = usuarioIdExplorar;
    const consultaVigente = () => consultaCatalogoRef.current === numeroConsulta &&
      usuarioIdExplorarRef.current === usuarioId;
    carregamentoEmAndamentoRef.current = true;
    setCarregandoMaisCatalogo(true);

    try {
      const resultado = await carregarObrasPublicadasSupabase(
        obrasLocais,
        usuarioId,
        [{ ...consultaCatalogoAtual, cursor: proximoCursorCatalogo }],
        filtroColecaoCatalogo,
        Boolean(filtroColecaoCatalogo),
        consultaVigente,
      );

      if (consultaVigente()) {
        if (resultado.falhaTemporaria) {
          setErroCatalogoExplorar("paginacao");
          return;
        }

        paginaConfirmadaRef.current = { ...paginaConfirmada,
          cursor: resultado.pagina?.proximoCursor || null };
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
      if (consultaVigente()) {
        setErroCatalogoExplorar("paginacao");
      }
    } finally {
      if (consultaVigente()) {
        carregamentoEmAndamentoRef.current = false;
        setCarregandoMaisCatalogo(false);
      }
    }
  }

  const filtrosConfirmados = consultaFiltrosConfirmada?.consulta === consultaCatalogoAtual &&
    consultaFiltrosConfirmada.usuarioId === usuarioIdExplorar &&
    consultaFiltrosConfirmada.colecao === filtroColecaoCatalogo &&
    consultaFiltrosConfirmada.retry === versaoRetryCatalogo &&
    dadosExplorarCarregados && (!filtroColecaoCatalogo || colecoesCarregadas);

  return { consultaCatalogoPersonalizada, carregarMaisObrasCatalogo,
    palavrasVerificadas: !palavrasAtivas || (!intervaloInvalido && filtrosConfirmados),
    statusEditorialVerificado: !statusEditorial || modoConteudo !== "obras" || filtrosConfirmados,
    notaMinimaVerificada: notaMinima === null || filtrosConfirmados,
    generoExcluidoVerificado: !generoExcluido || modoConteudo !== "obras" || filtrosConfirmados,
    tagExcluidaVerificada: !tagExcluida || modoConteudo !== "obras" || filtrosConfirmados };
}
