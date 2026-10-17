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
  carregarListaIdsUsuarioExplorar,
  salvarListaIdsUsuarioExplorar,
  obterArquivoObraComBackup,
  salvarBackupsArquivosObras,
} from "../lib/explorar-local-storage";
import {
  STORAGE_KEY,
  carregarColecoesUsuarioExplorar,
  carregarObrasPublicadasSupabase,
} from "../lib/explorar-remote-loader";

type OpcoesCarregamentoInicialExplorar = {
  obrasCacheLocalRef: RefObject<ObraLocal[]>;
  usuarioIdExplorarRef: RefObject<string>;
  setModoConteudo: Dispatch<SetStateAction<"obras" | "autores">>;
  setCategoriaSelecionada: Dispatch<SetStateAction<string>>;
  setUsuarioLogado: Dispatch<SetStateAction<boolean>>;
  setObrasLocais: Dispatch<SetStateAction<ObraLocal[]>>;
  setObrasFavoritas: Dispatch<SetStateAction<string[]>>;
  setObrasConcluidas: Dispatch<SetStateAction<string[]>>;
  setProximoCursorCatalogo: Dispatch<SetStateAction<CursorCatalogo | null>>;
  setCatalogoTemMais: Dispatch<SetStateAction<boolean>>;
  setDadosExplorarCarregados: Dispatch<SetStateAction<boolean>>;
  FAVORITES_STORAGE_KEY: string;
  COMPLETED_STORAGE_KEY: string;
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
      setUsuarioLogado,
      setObrasLocais,
      setObrasFavoritas,
      setObrasConcluidas,
      setProximoCursorCatalogo,
      setCatalogoTemMais,
      setDadosExplorarCarregados,
      FAVORITES_STORAGE_KEY,
      COMPLETED_STORAGE_KEY,
    } = opcoesIniciaisRef.current;

    let cancelado = false;

    async function carregarExplorar() {
      const params = new URLSearchParams(window.location.search);
      const categoriaParam = params.get("categoria") || "";
      const tipoParam = params.get("tipo") === "autores" ? "autores" : "obras";

      setModoConteudo(tipoParam);
      setCategoriaSelecionada(categoriaParam.trim());

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

        const favoritasGlobais: string[] = [];
        const favoritasDoUsuario = userIdAtual
          ? carregarListaIdsUsuarioExplorar(FAVORITES_STORAGE_KEY, userIdAtual)
          : [];

        const concluidasGlobais: string[] = [];
        const concluidasDoUsuario = userIdAtual
          ? carregarListaIdsUsuarioExplorar(COMPLETED_STORAGE_KEY, userIdAtual)
          : [];

        const colecoesSupabase = userIdAtual
          ? await carregarColecoesUsuarioExplorar(userIdAtual)
          : { favoritas: [] as string[], concluidas: [] as string[] };

        const obrasFavoritasNormalizadas = Array.from(
          new Set([
            ...favoritasGlobais,
            ...favoritasDoUsuario,
            ...colecoesSupabase.favoritas,
          ])
        );
        const obrasConcluidasNormalizadas = Array.from(
          new Set([
            ...concluidasGlobais,
            ...concluidasDoUsuario,
            ...colecoesSupabase.concluidas,
          ])
        );

        salvarListaIdsUsuarioExplorar(
          FAVORITES_STORAGE_KEY,
          userIdAtual,
          obrasFavoritasNormalizadas
        );
        salvarListaIdsUsuarioExplorar(
          COMPLETED_STORAGE_KEY,
          userIdAtual,
          obrasConcluidasNormalizadas
        );

        if (!cancelado) {
          setObrasLocais(obrasNormalizadas);
          setObrasFavoritas(obrasFavoritasNormalizadas);
          setObrasConcluidas(obrasConcluidasNormalizadas);
        }

        const resultadoCatalogo = await carregarObrasPublicadasSupabase(
          obrasNormalizadas,
          userIdAtual
        );

        if (!cancelado) {
          setObrasLocais(resultadoCatalogo.obras);
          setProximoCursorCatalogo(resultadoCatalogo.pagina?.proximoCursor || null);
          setCatalogoTemMais(Boolean(resultadoCatalogo.pagina?.temMais));
        }
      } catch {
        if (!cancelado) {
          setObrasLocais([]);
          setObrasFavoritas([]);
          setObrasConcluidas([]);
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
