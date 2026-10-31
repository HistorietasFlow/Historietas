import type { Dispatch, SetStateAction } from "react";
import type { TablesUpdate } from "../../../../lib/supabase/database.types";
import { atualizarProblemaTecnicoAdmin } from "../actions/atualizar-problema-tecnico-admin";
import { criarMensagemErro } from "../lib/admin-problemas-tecnicos-error-utils";
import {
  normalizarPrioridade,
  normalizarStatus,
  type ProblemaTecnico,
} from "../lib/admin-problemas-tecnicos-normalization-utils";
import type { TextoTraduzido } from "../lib/admin-problemas-tecnicos-text-utils";

type UseAdminProblemasTecnicosActionsParams = {
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
  usuarioId,
  ehAdmin,
  t,
  setProblemas,
  setObservacoes,
  setAcaoEmAndamento,
  setErro,
  setSucesso,
}: UseAdminProblemasTecnicosActionsParams) {
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

    setAcaoEmAndamento(problema.id);
    setErro("");
    setSucesso("");

    try {
      const payload: TablesUpdate<"problemas_tecnicos"> = {};

      if (alteracoes.status) payload.status = alteracoes.status;
      if (alteracoes.prioridade) payload.prioridade = alteracoes.prioridade;
      if (typeof alteracoes.observacaoAdmin === "string") {
        payload.observacao_admin = alteracoes.observacaoAdmin.trim();
      }

      const { data, error } = await atualizarProblemaTecnicoAdmin({
        id: problema.id,
        payload,
      });

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("O chamado não foi encontrado ou não pôde ser atualizado.");
      }

      const atualizado = data;

      setProblemas((atuais) =>
        atuais.map((item) =>
          item.id === problema.id
            ? {
                ...item,
                status: normalizarStatus(atualizado.status),
                prioridade: normalizarPrioridade(atualizado.prioridade),
                observacaoAdmin: String(atualizado.observacao_admin || ""),
                analisadoPor: String(atualizado.analisado_por || ""),
                analisadoEm: String(atualizado.analisado_em || ""),
                atualizadoEm: String(atualizado.atualizado_em || ""),
              }
            : item,
        ),
      );
      setObservacoes((atuais) => ({
        ...atuais,
        [problema.id]: String(atualizado.observacao_admin || ""),
      }));
      setSucesso(mensagemSucesso);
    } catch (error) {
      setErro(criarMensagemErro("Erro ao atualizar chamado técnico", error));
    } finally {
      setAcaoEmAndamento("");
    }
  }

  return { atualizarChamado };
}
