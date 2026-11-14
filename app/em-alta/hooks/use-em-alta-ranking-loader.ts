"use client";

import { useEffect, useState, type RefObject } from "react";
import type { IdentidadeEmAlta } from "./use-em-alta-auth-session";
import type { ObraLocal } from "../lib/em-alta-models";
import { carregarColecoesRankingEmAlta } from "../lib/em-alta-ranking-collections-loader";
import { carregarInteracoesLocaisRankingEmAlta } from "../lib/em-alta-ranking-local-interactions";
import { carregarObrasSupabasePublicadas } from "../lib/em-alta-supabase-works-loader";
import { obterVersaoColecoesEmAlta } from "../lib/em-alta-collection-supabase-sync";

export function useEmAltaRankingLoader({
  usuarioLogadoId, autenticacaoCarregada, versaoIdentidade, identidadeSessaoRef,
  setCarregandoRanking, setObrasLocais, setObrasFavoritas, setObrasConcluidas,
  setVisualizacoesRegistradas, setAvaliacoesLocaisRegistradas,
}: {
  usuarioLogadoId: string;
  autenticacaoCarregada: boolean;
  versaoIdentidade: number;
  identidadeSessaoRef: RefObject<IdentidadeEmAlta>;
  setCarregandoRanking: (valor: boolean) => void;
  setObrasLocais: (valor: ObraLocal[]) => void;
  setObrasFavoritas: (valor: string[]) => void;
  setObrasConcluidas: (valor: string[]) => void;
  setVisualizacoesRegistradas: (valor: Record<string, number>) => void;
  setAvaliacoesLocaisRegistradas: (valor: Record<string, number>) => void;
}) {
  const [tentativa, setTentativa] = useState(0);
  const [erroRanking, setErroRanking] = useState(false);
  const [identidadeAplicada, setIdentidadeAplicada] = useState<{ usuarioId: string; versao: number } | null>(null);
  useEffect(() => {
    if (!autenticacaoCarregada) return;
    let cancelado = false;
    const atual = () => !cancelado && identidadeSessaoRef.current.usuarioId === usuarioLogadoId &&
      identidadeSessaoRef.current.versao === versaoIdentidade;
    async function carregarRanking() {
      setCarregandoRanking(true);
      setErroRanking(false);
      if (identidadeAplicada?.usuarioId !== usuarioLogadoId || identidadeAplicada.versao !== versaoIdentidade) {
        setObrasLocais([]); setObrasFavoritas([]); setObrasConcluidas([]);
        setVisualizacoesRegistradas({}); setAvaliacoesLocaisRegistradas({});
      }
      try {
        let amostraLimitada = false;
        const [colecoes, obras] = await Promise.allSettled([
          carregarColecoesRankingEmAlta(usuarioLogadoId, atual),
          carregarObrasSupabasePublicadas([], usuarioLogadoId, { aoUsarAmostraLimitada: () => { amostraLimitada = true; } }),
        ]);
        if (!atual()) return;
        const interacoes = carregarInteracoesLocaisRankingEmAlta(usuarioLogadoId);
        setVisualizacoesRegistradas(interacoes.visualizacoesNormalizadas);
        setAvaliacoesLocaisRegistradas(interacoes.avaliacoesLocaisNormalizadas);
        if (colecoes.status === "fulfilled" && !colecoes.value.obsoletas &&
            colecoes.value.versao === obterVersaoColecoesEmAlta(usuarioLogadoId)) {
          setObrasFavoritas(colecoes.value.obrasFavoritasNormalizadas);
          setObrasConcluidas(colecoes.value.obrasConcluidasNormalizadas);
        }
        if (colecoes.status === "rejected") { setObrasFavoritas([]); setObrasConcluidas([]); }
        setObrasLocais(obras.status === "fulfilled" ? obras.value : []);
        setErroRanking(amostraLimitada || obras.status === "rejected" || colecoes.status === "rejected" ||
          (colecoes.status === "fulfilled" && colecoes.value.falhaTemporaria));
      } catch {
        if (atual()) { setErroRanking(true); setObrasLocais([]); }
      } finally {
        if (atual()) {
          setIdentidadeAplicada({ usuarioId: usuarioLogadoId, versao: versaoIdentidade });
          setCarregandoRanking(false);
        }
      }
    }
    void carregarRanking();
    return () => { cancelado = true; };
    // Os setters da página e a ref da sessão são estáveis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioLogadoId, autenticacaoCarregada, versaoIdentidade, tentativa]);
  return { erroRanking, tentarCarregarRanking: () => setTentativa(valor => valor + 1),
    dadosDaIdentidadeAtual: autenticacaoCarregada && identidadeAplicada?.usuarioId === usuarioLogadoId && identidadeAplicada.versao === versaoIdentidade };
}
