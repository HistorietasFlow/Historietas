export type OrigemHistoricoModeracao = "conteudo" | "perfil";

export type AcaoHistoricoModeracao =
  | "criada"
  | "migrada"
  | "status_alterado"
  | "arquivada"
  | "restaurada"
  | "atualizada"
  | "excluida";

const ACOES_HISTORICO = new Set<AcaoHistoricoModeracao>([
  "criada",
  "migrada",
  "status_alterado",
  "arquivada",
  "restaurada",
  "atualizada",
  "excluida",
]);

const ROTULOS_ACAO: Record<AcaoHistoricoModeracao, string> = {
  criada: "Denúncia criada",
  migrada: "Registro incorporado ao histórico",
  status_alterado: "Status alterado",
  arquivada: "Denúncia arquivada",
  restaurada: "Denúncia restaurada",
  atualizada: "Registro atualizado",
  excluida: "Denúncia removida do painel",
};

const ROTULOS_STATUS: Record<string, string> = {
  pendente: "Pendente",
  em_analise: "Em análise",
  analisada: "Analisada",
  resolvida: "Resolvida",
  rejeitada: "Rejeitada",
  ignorada: "Ignorada",
};

export function normalizarOrigemHistoricoModeracao(
  valor: unknown,
): OrigemHistoricoModeracao {
  return valor === "perfil" ? "perfil" : "conteudo";
}

export function normalizarAcaoHistoricoModeracao(
  valor: unknown,
): AcaoHistoricoModeracao {
  return ACOES_HISTORICO.has(valor as AcaoHistoricoModeracao)
    ? (valor as AcaoHistoricoModeracao)
    : "atualizada";
}

export function rotuloAcaoHistoricoModeracao(
  acao: AcaoHistoricoModeracao,
) {
  return ROTULOS_ACAO[acao];
}

export function rotuloStatusHistoricoModeracao(status: string | null) {
  if (!status) {
    return "Sem status";
  }

  return ROTULOS_STATUS[status] || status.replaceAll("_", " ");
}

export function rotuloResponsavelHistoricoModeracao({
  acao,
  moderadorId,
  moderadorNome,
}: {
  acao: AcaoHistoricoModeracao;
  moderadorId: string;
  moderadorNome: string;
}) {
  if (moderadorId) {
    return moderadorNome || "Moderador identificado";
  }

  if (acao === "criada") {
    return "Usuário denunciante";
  }

  if (acao === "migrada") {
    return "Migração do sistema";
  }

  return "Automação interna";
}
