import type { SolicitacaoExclusao } from "./admin-exclusoes-conta-normalization-utils";

export function calcularTotaisSolicitacoesExclusao(
  solicitacoes: SolicitacaoExclusao[],
) {
  return {
    total: solicitacoes.length,
    pendentes: solicitacoes.filter((item) => item.status === "pendente").length,
    verificando: solicitacoes.filter((item) => item.status === "verificando")
      .length,
    concluidas: solicitacoes.filter((item) => item.status === "concluida").length,
    encerradas: solicitacoes.filter(
      (item) => item.status === "recusada" || item.status === "cancelada",
    ).length,
  };
}
