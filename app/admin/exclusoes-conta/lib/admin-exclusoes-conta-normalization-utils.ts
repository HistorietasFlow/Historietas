export type StatusSolicitacaoExclusao =
  | "pendente"
  | "verificando"
  | "concluida"
  | "recusada"
  | "cancelada";

export type FiltroStatus = StatusSolicitacaoExclusao | "todos";

export type SolicitacaoExclusao = {
  id: string;
  email: string;
  motivo: string;
  origem: string;
  status: StatusSolicitacaoExclusao;
  userAgent: string;
  criadaEm: string;
  atualizadaEm: string;
  processadaEm: string;
  observacaoInterna: string;
};

export type StatusOperacaoRecuperavel = "falhou" | "excluindo_auth";

export type OperacaoRecuperavel = {
  id: string;
  status: StatusOperacaoRecuperavel;
  bucketsPendentes: string[];
  bucketsConcluidos: string[];
  tentativasStorage: number;
  tentativasAuth: number;
  ultimoErroCodigo: string;
  ultimoErroMensagem: string;
  ultimaFalhaEm: string;
  lockExpiraEm: string;
  lockAtivo: boolean;
  criadaEm: string;
  atualizadaEm: string;
  storageLimpoEm: string;
  authExcluidoEm: string;
};

export const STATUS_SOLICITACOES: StatusSolicitacaoExclusao[] = [
  "pendente",
  "verificando",
  "concluida",
  "recusada",
  "cancelada",
];

export function normalizarStatus(valor: unknown): StatusSolicitacaoExclusao {
  return STATUS_SOLICITACOES.includes(valor as StatusSolicitacaoExclusao)
    ? (valor as StatusSolicitacaoExclusao)
    : "pendente";
}

export function normalizarSolicitacao(valor: unknown): SolicitacaoExclusao | null {
  if (!valor || typeof valor !== "object") {
    return null;
  }

  const registro = valor as Record<string, unknown>;
  const id = String(registro.id || "").trim();

  if (!id) {
    return null;
  }

  return {
    id,
    email: String(registro.email || ""),
    motivo: String(registro.motivo || ""),
    origem: String(registro.origem || ""),
    status: normalizarStatus(registro.status),
    userAgent: String(registro.user_agent || ""),
    criadaEm: String(registro.criada_em || ""),
    atualizadaEm: String(registro.atualizada_em || ""),
    processadaEm: String(registro.processada_em || ""),
    observacaoInterna: String(registro.observacao_interna || ""),
  };
}

export function normalizarOperacaoRecuperavel(valor: unknown): OperacaoRecuperavel | null {
  if (!valor || typeof valor !== "object") {
    return null;
  }

  const registro = valor as Record<string, unknown>;
  const id = String(registro.id || "").trim();
  const status = String(registro.status || "").trim();

  if (!id || (status !== "falhou" && status !== "excluindo_auth")) {
    return null;
  }

  const listaStrings = (item: unknown) =>
    Array.isArray(item)
      ? item.filter((valorLista): valorLista is string => typeof valorLista === "string")
      : [];

  return {
    id,
    status,
    bucketsPendentes: listaStrings(registro.buckets_pendentes),
    bucketsConcluidos: listaStrings(registro.buckets_concluidos),
    tentativasStorage: Number(registro.tentativas_storage || 0),
    tentativasAuth: Number(registro.tentativas_auth || 0),
    ultimoErroCodigo: String(registro.ultimo_erro_codigo || ""),
    ultimoErroMensagem: String(registro.ultimo_erro_mensagem || ""),
    ultimaFalhaEm: String(registro.ultima_falha_em || ""),
    lockExpiraEm: String(registro.lock_expira_em || ""),
    lockAtivo: registro.lock_ativo === true,
    criadaEm: String(registro.criada_em || ""),
    atualizadaEm: String(registro.atualizada_em || ""),
    storageLimpoEm: String(registro.storage_limpo_em || ""),
    authExcluidoEm: String(registro.auth_excluido_em || ""),
  };
}
