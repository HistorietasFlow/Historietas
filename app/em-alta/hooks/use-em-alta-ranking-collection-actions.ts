import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { IdentidadeEmAlta } from "./use-em-alta-auth-session";
import type { ObraRanking } from "../lib/em-alta-models";
import { adicionarRankingObraNaLista, listaTemRankingObra, removerRankingObraDaLista } from "../lib/em-alta-ranking-list-utils";
import { COMPLETED_STORAGE_KEY, FAVORITES_STORAGE_KEY, salvarListaIdsLocalEmAlta } from "../lib/em-alta-local-storage-utils";
import { sincronizarColecaoRankingSupabase } from "../lib/em-alta-collection-supabase-sync";
import { registrarColecaoRankingNoDiario } from "../lib/em-alta-diary-activity";

type Colecao = "favoritos" | "concluidas";
type Contexto = {
  identidade: IdentidadeEmAlta; ativo: boolean; pendentes: number;
  desejadas: Record<Colecao, string[]>; confirmadas: Record<Colecao, string[]>;
  revisoes: Record<Colecao, number>; filas: Record<Colecao, Promise<void>>;
};
export function useEmAltaRankingCollectionActions({
  ranking, obrasFavoritas, obrasConcluidas, usuarioLogadoId, identidadeSessaoRef,
  usuarioTemSessaoAtiva, avisarLoginRanking, setObrasFavoritas, setObrasConcluidas,
}: {
  ranking: ObraRanking[]; obrasFavoritas: string[]; obrasConcluidas: string[]; usuarioLogadoId: string;
  identidadeSessaoRef: RefObject<IdentidadeEmAlta>;
  usuarioTemSessaoAtiva: () => Promise<boolean>; avisarLoginRanking: () => void;
  setObrasFavoritas: (lista: string[]) => void; setObrasConcluidas: (lista: string[]) => void;
}) {
  const contextoRef = useRef<Contexto | null>(null);
  const [mensagemColecao, setMensagemColecao] = useState("");
  const [salvandoColecao, setSalvandoColecao] = useState(false);
  function limparFeedback() { setMensagemColecao(""); setSalvandoColecao(false); }
  useLayoutEffect(() => {
    let contexto = contextoRef.current;
    if (!contexto?.ativo || contexto.identidade.versao !== identidadeSessaoRef.current.versao || contexto.identidade.usuarioId !== usuarioLogadoId) {
      contexto = { identidade: { ...identidadeSessaoRef.current }, ativo: true, pendentes: 0,
        desejadas: { favoritos: obrasFavoritas, concluidas: obrasConcluidas },
        confirmadas: { favoritos: obrasFavoritas, concluidas: obrasConcluidas },
        revisoes: { favoritos: 0, concluidas: 0 }, filas: { favoritos: Promise.resolve(), concluidas: Promise.resolve() } };
      contextoRef.current = contexto;
      limparFeedback();
    } else if (contexto.pendentes === 0) {
      contexto.confirmadas = { favoritos: obrasFavoritas, concluidas: obrasConcluidas };
      contexto.desejadas = { ...contexto.confirmadas };
    }
  });
  useLayoutEffect(() => () => { if (contextoRef.current) contextoRef.current.ativo = false; }, []);
  function atual(contexto: Contexto) {
    return contexto.ativo && contexto === contextoRef.current && contexto.identidade.usuarioId === usuarioLogadoId &&
      identidadeSessaoRef.current.usuarioId === usuarioLogadoId && identidadeSessaoRef.current.versao === contexto.identidade.versao;
  }
  async function alternar(tabela: Colecao, obraId: string) {
    const contexto = contextoRef.current;
    if (!contexto || !atual(contexto)) return;
    if (!usuarioLogadoId) { await usuarioTemSessaoAtiva(); if (!identidadeSessaoRef.current.usuarioId) avisarLoginRanking(); return; }
    const obraRanking = ranking.find(obra => obra.storageId === obraId || obra.id === obraId);
    if (!obraRanking) return;
    const ativo = !listaTemRankingObra(obraRanking, contexto.desejadas[tabela]);
    contexto.desejadas[tabela] = ativo ? adicionarRankingObraNaLista(obraRanking, contexto.desejadas[tabela]) : removerRankingObraDaLista(obraRanking, contexto.desejadas[tabela]);
    const revisao = ++contexto.revisoes[tabela];
    contexto.pendentes += 1;
    setSalvandoColecao(true); setMensagemColecao("");
    const tarefa = contexto.filas[tabela].then(async () => {
      try {
        if (!atual(contexto)) return;
        const logado = await usuarioTemSessaoAtiva();
        if (!logado) { if (!identidadeSessaoRef.current.usuarioId) avisarLoginRanking(); return; }
        if (!atual(contexto)) return;
        const resultado = await sincronizarColecaoRankingSupabase(tabela, obraRanking, ativo, usuarioLogadoId, () => atual(contexto));
        if (!atual(contexto)) return;
        if (!resultado.ok) throw new Error(resultado.erro);
        contexto.confirmadas[tabela] = ativo ? adicionarRankingObraNaLista(obraRanking, contexto.confirmadas[tabela]) : removerRankingObraDaLista(obraRanking, contexto.confirmadas[tabela]);
        salvarListaIdsLocalEmAlta(tabela === "favoritos" ? FAVORITES_STORAGE_KEY : COMPLETED_STORAGE_KEY, usuarioLogadoId, contexto.confirmadas[tabela]);
        (tabela === "favoritos" ? setObrasFavoritas : setObrasConcluidas)(contexto.confirmadas[tabela]);
        if (ativo) void registrarColecaoRankingNoDiario(tabela === "favoritos" ? "favoritou_obra" : "concluiu_obra", obraRanking, usuarioLogadoId, () => atual(contexto));
      } catch {
        if (atual(contexto) && revisao === contexto.revisoes[tabela]) {
          contexto.desejadas[tabela] = contexto.confirmadas[tabela];
          setMensagemColecao("Não foi possível confirmar a alteração da coleção. Tente novamente.");
        }
      } finally {
        contexto.pendentes -= 1;
        if (atual(contexto) && contexto.pendentes === 0) setSalvandoColecao(false);
      }
    });
    contexto.filas[tabela] = tarefa;
    await tarefa;

  }
  async function alternarFavorito(obraId: string) { await alternar("favoritos", obraId); }
  async function alternarConcluido(obraId: string) { await alternar("concluidas", obraId); }
  return { alternarFavorito, alternarConcluido, mensagemColecao, salvandoColecao };
}
