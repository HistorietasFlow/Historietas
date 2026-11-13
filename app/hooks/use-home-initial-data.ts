"use client";

import { useCallback, useEffect, useState } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { carregarPerfisAutoresHomeSalvos } from "../lib/home-author-storage-utils";
import type { PerfisAutoresSalvos } from "../lib/home-author-profile-utils";
import { carregarSnapshotInicialHome } from "../lib/home-initial-data-loader";
import { carregarObrasSupabaseHome } from "../lib/home-supabase-works-loader";

type ObrasLocaisHome = Awaited<ReturnType<typeof carregarObrasSupabaseHome>>;
type DadosHome = {
  usuarioId: string | null;
  obrasLocais: ObrasLocaisHome;
  obrasFavoritas: string[];
  perfisAutores: PerfisAutoresSalvos;
  carregados: boolean;
  erro: boolean;
};
const DADOS_VAZIOS: DadosHome = {
  usuarioId: null, obrasLocais: [], obrasFavoritas: [], perfisAutores: {},
  carregados: false, erro: false,
};
const STORAGE_KEY = "historietas-obras";
export const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";

export default function useHomeInitialData(
  usuarioIdLogado: string,
  obrasCacheLocalHomeRef: MutableRefObject<ObrasLocaisHome>
) {
  const usuarioId = usuarioIdLogado.trim();
  const [dados, setDados] = useState<DadosHome>(DADOS_VAZIOS);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let cancelado = false;
    const anterior = dados.usuarioId === usuarioId ? dados : DADOS_VAZIOS;
    if (dados.usuarioId !== usuarioId) obrasCacheLocalHomeRef.current = [];

    async function carregarDadosHome() {
      let falhou = false;
      let obrasRemotas: Promise<ObrasLocaisHome> | undefined;
      const aoFalhar = () => { falhou = true; };
      try {
        // Yield only to allow cleanup; no timer or second auth lookup.
        await Promise.resolve();
        if (cancelado) return;
        const snapshot = await carregarSnapshotInicialHome({
          usuarioIdLogado: usuarioId,
          storageKey: STORAGE_KEY,
          favoritesStorageKey: FAVORITES_STORAGE_KEY,
          completedStorageKey: COMPLETED_STORAGE_KEY,
          resolverUsuario: false,
          estaAtivo: () => !cancelado,
          aoFalhar,
          snapshotAnterior: {
            userIdHome: usuarioId,
            obrasNormalizadas: anterior.obrasLocais,
            obrasFavoritasNormalizadas: anterior.obrasFavoritas,
            perfisAutoresNormalizados: anterior.perfisAutores,
          },
          aoNormalizarObras: (obras, userIdHome) => {
            if (cancelado) return;
            obrasCacheLocalHomeRef.current = obras;
            // Collections and works are independent. Handle rejection at once,
            // even if collection loading is still pending when this settles.
            obrasRemotas = (async () => {
              let falhouObras = false;
              const preservar = () => anterior.obrasLocais.length ? anterior.obrasLocais : obras;
              try {
                const remotas = await carregarObrasSupabaseHome(obras, userIdHome, undefined, () => {
                  falhouObras = true;
                  aoFalhar();
                });
                return falhouObras && preservar().length ? preservar() : remotas;
              } catch {
                aoFalhar();
                return preservar();
              }
            })();
          },
        });
        if (cancelado) return;
        const obras = await obrasRemotas;
        if (cancelado) return;
        const perfis = carregarPerfisAutoresHomeSalvos(usuarioId, aoFalhar);
        setDados({
          usuarioId, obrasLocais: obras || snapshot.obrasNormalizadas,
          obrasFavoritas: snapshot.obrasFavoritasNormalizadas,
          perfisAutores: { ...snapshot.perfisAutoresNormalizados, ...perfis },
          carregados: true, erro: falhou,
        });
      } catch {
        if (!cancelado) setDados({ ...anterior, usuarioId, carregados: true, erro: true });
      }
    }
    void carregarDadosHome();
    return () => { cancelado = true; };
    // Capture the previous snapshot only at the start of this identity/attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioId, tentativa]);

  const setObrasLocais: Dispatch<SetStateAction<ObrasLocaisHome>> = useCallback((valor) => {
    setDados((atual) => atual.usuarioId !== usuarioId ? atual : {
      ...atual, obrasLocais: typeof valor === "function" ? valor(atual.obrasLocais) : valor,
    });
  }, [usuarioId]);
  const setObrasFavoritas: Dispatch<SetStateAction<string[]>> = useCallback((valor) => {
    setDados((atual) => atual.usuarioId !== usuarioId ? atual : {
      ...atual, obrasFavoritas: typeof valor === "function" ? valor(atual.obrasFavoritas) : valor,
    });
  }, [usuarioId]);
  const recarregarDadosHome = () => {
    setDados((atual) => ({ ...atual, carregados: false }));
    setTentativa((atual) => atual + 1);
  };
  // Mask the previous account already during render, before effect cleanup.
  const atuais = dados.usuarioId === usuarioId ? dados : DADOS_VAZIOS;
  return {
    obrasLocais: atuais.obrasLocais,
    obrasFavoritas: atuais.obrasFavoritas,
    perfisAutores: atuais.perfisAutores,
    dadosHomeCarregados: atuais.carregados,
    erroCarregamentoHome: atuais.erro,
    recarregarDadosHome,
    setObrasLocais,
    setObrasFavoritas,
  };
}
