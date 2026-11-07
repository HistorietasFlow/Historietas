"use client";

import { useEffect, useRef } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import type { CursorCatalogo } from "../../../lib/catalogo";
import { normalizarObra } from "../lib/explorar-work-normalizers";
import type { ObraLocal } from "../lib/explorar-work-normalizers";
import {
  lerStorageUsuarioExplorar,
  salvarJsonStorageUsuarioExplorar,
  obterArquivoObraComBackup,
  salvarBackupsArquivosObras,
} from "../lib/explorar-local-storage";
import {
  STORAGE_KEY,
  carregarObrasPublicadasSupabase,
} from "../lib/explorar-remote-loader";
import type { OrdenacaoExplorar } from "../lib/explorar-derived-utils";
import { lerFiltrosCompartilhaveisExplorar } from "../lib/explorar-page-route-utils";
import type { ErroCatalogoExplorar } from "./use-explorar-catalog-pagination-state";

type OpcoesCarregamentoInicialExplorar = {
  obrasCacheLocalRef: RefObject<ObraLocal[]>;
  usuarioIdExplorarRef: RefObject<string>;
  setModoConteudo: Dispatch<SetStateAction<"obras" | "autores">>;
  setCategoriaSelecionada: Dispatch<SetStateAction<string>>;
  setBusca: Dispatch<SetStateAction<string>>;
  setOrdenacao: Dispatch<SetStateAction<OrdenacaoExplorar>>;
  setFiltroFormato: Dispatch<SetStateAction<string>>;
  setFiltroTag: Dispatch<SetStateAction<string>>;
  setTagExcluida: Dispatch<SetStateAction<string>>;
  setNotaMinima: Dispatch<SetStateAction<number | null>>;
  setUsuarioLogado: Dispatch<SetStateAction<boolean>>;
  setObrasLocais: Dispatch<SetStateAction<ObraLocal[]>>;
  setProximoCursorCatalogo: Dispatch<SetStateAction<CursorCatalogo | null>>;
  setCatalogoTemMais: Dispatch<SetStateAction<boolean>>;
  setErroCatalogoExplorar: Dispatch<SetStateAction<ErroCatalogoExplorar>>;
  setDadosExplorarCarregados: Dispatch<SetStateAction<boolean>>;
};

export function useExplorarInitialLoad(opcoes: OpcoesCarregamentoInicialExplorar) {
  // Os setters e refs pertencem à página e são estáveis durante seu ciclo de vida.
  const opcoesIniciaisRef = useRef(opcoes);

  useEffect(() => {
    const {
      obrasCacheLocalRef,
      usuarioIdExplorarRef,
      setModoConteudo,
      setCategoriaSelecionada,
      setBusca,
      setOrdenacao,
      setFiltroFormato,
      setFiltroTag,
      setTagExcluida,
      setNotaMinima,
      setUsuarioLogado,
      setObrasLocais,
      setProximoCursorCatalogo,
      setCatalogoTemMais,
      setErroCatalogoExplorar,
      setDadosExplorarCarregados,
    } = opcoesIniciaisRef.current;

    let cancelado = false;

    async function carregarExplorar() {
      const filtrosCompartilhaveis = lerFiltrosCompartilhaveisExplorar(
        window.location.search,
      );

      setModoConteudo(filtrosCompartilhaveis.modoConteudo);
      setCategoriaSelecionada(filtrosCompartilhaveis.categoriaSelecionada);
      setBusca(filtrosCompartilhaveis.busca);
      setOrdenacao(filtrosCompartilhaveis.ordenacao);
      setFiltroFormato(filtrosCompartilhaveis.filtroFormato);
      setFiltroTag(filtrosCompartilhaveis.filtroTag || "");
      setTagExcluida(filtrosCompartilhaveis.tagExcluida || "");
      setNotaMinima(filtrosCompartilhaveis.notaMinima ?? null);

      try {
        let userIdAtual = "";

        try {
          const { data } = await supabase.auth.getUser();
          userIdAtual = data.user?.id || "";
        } catch {
          userIdAtual = "";
        }

        if (!cancelado) {
          setUsuarioLogado(Boolean(userIdAtual));
        }

        const obrasSalvasTexto = lerStorageUsuarioExplorar(
          STORAGE_KEY,
          userIdAtual
        );
        const obrasSalvasJson = obrasSalvasTexto
          ? JSON.parse(obrasSalvasTexto)
          : [];

        const obrasNormalizadas: ObraLocal[] = Array.isArray(obrasSalvasJson)
          ? obrasSalvasJson.map((obra, index) =>
              normalizarObra(obra, index, userIdAtual, obterArquivoObraComBackup)
            )
          : [];

        obrasCacheLocalRef.current = obrasNormalizadas;
        usuarioIdExplorarRef.current = userIdAtual;

        salvarBackupsArquivosObras(obrasNormalizadas, userIdAtual);
        salvarJsonStorageUsuarioExplorar(STORAGE_KEY, userIdAtual, obrasNormalizadas);

        if (!cancelado) {
          setObrasLocais(obrasNormalizadas);
        }

        const resultadoCatalogo = await carregarObrasPublicadasSupabase(
          obrasNormalizadas,
          userIdAtual
        );

        if (!cancelado) {
          setObrasLocais(resultadoCatalogo.obras);
          setProximoCursorCatalogo(resultadoCatalogo.pagina?.proximoCursor || null);
          setCatalogoTemMais(Boolean(resultadoCatalogo.pagina?.temMais));
          setErroCatalogoExplorar(
            resultadoCatalogo.falhaTemporaria ? "consulta" : null,
          );
        }
      } catch {
        if (!cancelado) {
          setObrasLocais(obrasCacheLocalRef.current);
          setErroCatalogoExplorar("consulta");
        }
      } finally {
        if (!cancelado) {
          setDadosExplorarCarregados(true);
        }
      }
    }

    void carregarExplorar();

    return () => {
      cancelado = true;
    };
  }, []);
}
