"use client";

import { useEffect, useState } from "react";
import type { MutableRefObject } from "react";
import { carregarPerfisAutoresHomeSalvos } from "../lib/home-author-storage-utils";
import type { PerfisAutoresSalvos } from "../lib/home-author-profile-utils";
import { carregarSnapshotInicialHome } from "../lib/home-initial-data-loader";
import { carregarObrasSupabaseHome } from "../lib/home-supabase-works-loader";

type ObrasLocaisHome = Awaited<ReturnType<typeof carregarObrasSupabaseHome>>;

const STORAGE_KEY = "historietas-obras";
export const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";

export default function useHomeInitialData(
  usuarioIdLogado: string,
  obrasCacheLocalHomeRef: MutableRefObject<ObrasLocaisHome>
) {
  const [obrasLocais, setObrasLocais] = useState<ObrasLocaisHome>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [perfisAutores, setPerfisAutores] = useState<PerfisAutoresSalvos>({});
  const [dadosHomeCarregados, setDadosHomeCarregados] = useState(false);

  useEffect(() => {
    let cancelado = false;
    const reiniciarCarregamentoTimer = window.setTimeout(() => {
      if (!cancelado) {
        setDadosHomeCarregados(false);
      }
    }, 0);

    async function carregarDadosHome() {
      try {
        const {
          userIdHome,
          obrasNormalizadas,
          obrasFavoritasNormalizadas,
          perfisAutoresNormalizados,
        } = await carregarSnapshotInicialHome({
          usuarioIdLogado,
          storageKey: STORAGE_KEY,
          favoritesStorageKey: FAVORITES_STORAGE_KEY,
          completedStorageKey: COMPLETED_STORAGE_KEY,
          aoNormalizarObras: (obras) => {
            obrasCacheLocalHomeRef.current = obras;
          },
        });

        if (!cancelado) {
          setObrasLocais(obrasNormalizadas);
          setObrasFavoritas(obrasFavoritasNormalizadas);
          setPerfisAutores(perfisAutoresNormalizados);
        }

        const obrasComSupabase = await carregarObrasSupabaseHome(
          obrasNormalizadas,
          userIdHome
        );

        if (!cancelado) {
          window.clearTimeout(reiniciarCarregamentoTimer);
          setObrasLocais(obrasComSupabase);
          setPerfisAutores(carregarPerfisAutoresHomeSalvos(userIdHome));
          setDadosHomeCarregados(true);
        }
      } catch {
        if (!cancelado) {
          window.clearTimeout(reiniciarCarregamentoTimer);
          setObrasLocais([]);
          setObrasFavoritas([]);
          setPerfisAutores({});
          setDadosHomeCarregados(true);
        }
      }
    }

    void carregarDadosHome();

    return () => {
      cancelado = true;
      window.clearTimeout(reiniciarCarregamentoTimer);
    };
    // obrasCacheLocalHomeRef é estável e deve manter a dependência original do lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioIdLogado]);

  return {
    obrasLocais,
    obrasFavoritas,
    perfisAutores,
    dadosHomeCarregados,
    setObrasLocais,
    setObrasFavoritas,
  };
}
