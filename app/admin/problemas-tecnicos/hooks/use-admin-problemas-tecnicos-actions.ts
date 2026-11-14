import { useLayoutEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { TablesUpdate } from "../../../../lib/supabase/database.types";
import { atualizarProblemaTecnicoAdmin } from "../actions/atualizar-problema-tecnico-admin";
import { criarMensagemErro } from "../lib/admin-problemas-tecnicos-error-utils";
import {
  normalizarPrioridade,
  normalizarStatus,
  type ProblemaTecnico,
} from "../lib/admin-problemas-tecnicos-normalization-utils";
import { agendarOperacaoChamados, execucaoChamadosEstaAtual, type ReferenciaExecucaoChamados } from "../lib/admin-problemas-tecnicos-execution";
import type { TextoTraduzido } from "../lib/admin-problemas-tecnicos-text-utils";

type UseAdminProblemasTecnicosActionsParams = {
  contextoRef: ReferenciaExecucaoChamados;
  usuarioId: string;
  ehAdmin: boolean;
  t: (texto: TextoTraduzido) => string;
  setProblemas: Dispatch<SetStateAction<ProblemaTecnico[]>>;
  setObservacoes: Dispatch<SetStateAction<Record<string, string>>>;
  setAcaoEmAndamento: Dispatch<SetStateAction<string>>;
  setErro: Dispatch<SetStateAction<string>>;
  setSucesso: Dispatch<SetStateAction<string>>;
};

export function useAdminProblemasTecnicosActions({
  contextoRef,
  usuarioId,
  ehAdmin,
  t,
  setProblemas,
  setObservacoes,
  setAcaoEmAndamento,
  setErro,
  setSucesso,
}: UseAdminProblemasTecnicosActionsParams) {
  const montado = useRef(true);
  useLayoutEffect(() => {
    montado.current = true;
    return () => { montado.current = false; };
  }, []);
  async function atualizarChamado(
    problema: ProblemaTecnico,
    alteracoes: Partial<
      Pick<
        ProblemaTecnico,
        "status" | "prioridade" | "observacaoAdmin"
      >
    >,
    mensagemSucesso: string,
  ) {
    if (!usuarioId || !ehAdmin) {
      setErro(
        t({
          pt: "Apenas administradores podem atualizar chamados técnicos.",
          en: "Only administrators can update technical tickets.",
          es: "Solo los administradores pueden actualizar solicitudes técnicas.",
        }),
      );
      return;
    }

    const execucao = contextoRef.current;
    const atual = () => montado.current && execucaoChamadosEstaAtual(contextoRef, execucao) &&
      execucao.usuarioId === usuarioId && execucao.ehAdmin;
    if (!atual()) return;
    const payload: TablesUpdate<"problemas_tecnicos"> = {};
    if (alteracoes.status) payload.status = alteracoes.status;
    if (alteracoes.prioridade) payload.prioridade = alteracoes.prioridade;
    if (typeof alteracoes.observacaoAdmin === "string") payload.observacao_admin = alteracoes.observacaoAdmin.trim();
    if (Object.keys(payload).length === 0) return;
    const chave = JSON.stringify([problema.id, payload]);
    const repetida = execucao.pendentes.get(chave);
    if (repetida && execucao.ultimaChave === chave) return repetida;
    execucao.ultimaChave = chave;
    execucao.revisao += 1;

    const tarefa = agendarOperacaoChamados(execucao, async () => {
      if (!atual()) return;
      setAcaoEmAndamento(problema.id);
      setErro("");
      setSucesso("");
      try {
        const base = execucao.registros.get(problema.id);
        if (!base) throw new Error("O chamado não foi encontrado ou não pôde ser atualizado.");
        if ((!payload.status || payload.status === base.status) &&
            (!payload.prioridade || payload.prioridade === base.prioridade) &&
            (typeof payload.observacao_admin !== "string" || payload.observacao_admin === base.observacaoAdmin)) return;
        const { data, error } = await atualizarProblemaTecnicoAdmin({
          id: problema.id, payload, usuarioIdEsperado: usuarioId,
          atualizadoEmEsperado: base.atualizadoEm, execucaoEstaAtual: atual,
        });
        if (!atual()) return;
        if (error) throw error;
        if (!data || data.id !== problema.id) {
          throw new Error("O chamado não foi encontrado ou não pôde ser atualizado.");
        }
        if (execucao.registros.get(problema.id) !== base) {
          throw new Error("O chamado mudou durante a atualização. Recarregue os dados.");
        }
        if ((payload.status && data.status !== payload.status) ||
            (payload.prioridade && data.prioridade !== payload.prioridade) ||
            (typeof payload.observacao_admin === "string" && String(data.observacao_admin || "") !== payload.observacao_admin)) {
          throw new Error("A alteração solicitada não foi confirmada pelo servidor.");
        }
        const atualizado = data;
        const confirmado: ProblemaTecnico = {
          ...base,
          status: normalizarStatus(atualizado.status),
          prioridade: normalizarPrioridade(atualizado.prioridade),
          observacaoAdmin: String(atualizado.observacao_admin || ""),
          analisadoPor: String(atualizado.analisado_por || ""),
          analisadoEm: String(atualizado.analisado_em || ""),
          atualizadoEm: String(atualizado.atualizado_em || ""),
        };
        execucao.registros.set(problema.id, confirmado);
        setProblemas((atuais) => atual() ? atuais.map((item) => item.id === problema.id ? { ...item, ...confirmado } : item) : atuais);
        setObservacoes((atuais) => {
          if (!atual() || (atuais[problema.id] !== base.observacaoAdmin && atuais[problema.id] !== alteracoes.observacaoAdmin)) return atuais;
          return { ...atuais, [problema.id]: confirmado.observacaoAdmin };
        });
        setSucesso(mensagemSucesso);
      } catch (error) {
        if (atual()) setErro(criarMensagemErro("Erro ao atualizar chamado técnico", error));
      } finally {
        if (atual()) setAcaoEmAndamento(acaoAtual => acaoAtual === problema.id ? "" : acaoAtual);
      }
    });
    execucao.pendentes.set(chave, tarefa);
    try { await tarefa; }
    finally { if (execucao.pendentes.get(chave) === tarefa) execucao.pendentes.delete(chave); }
  }

  return { atualizarChamado };
}
