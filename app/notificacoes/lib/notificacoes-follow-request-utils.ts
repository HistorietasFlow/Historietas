import { notificacoesRepresentamMesmoEvento } from "./notificacoes-merge-utils";
import type { NotificacaoLocal } from "./notificacoes-models";

export function encontrarNotificacoesRelacionadasSolicitacaoSeguidor(
  notificacoes: NotificacaoLocal[],
  notificacao: NotificacaoLocal,
  solicitacaoId: string,
) {
  return notificacoes.filter(
    (notificacaoAtual) =>
      notificacaoAtual.tipo === "solicitacao-seguidor" &&
      (notificacaoAtual.solicitacaoId?.trim() === solicitacaoId ||
        notificacoesRepresentamMesmoEvento(notificacaoAtual, notificacao)),
  );
}

export function criarIdsNotificacoesRelacionadas(
  notificacoesRelacionadas: NotificacaoLocal[],
) {
  return new Set(
    notificacoesRelacionadas.map((notificacaoAtual) =>
      notificacaoAtual.id.trim(),
    ),
  );
}
