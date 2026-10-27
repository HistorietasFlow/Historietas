import type { StatusSolicitacaoExclusao } from "../lib/admin-exclusoes-conta-normalization-utils";

export type RespostaAtualizacao = {
  ok?: boolean;
  codigo?: string;
  mensagem?: string;
  solicitacao?: unknown;
};

type AtualizarSolicitacaoExclusaoAdminParams = {
  id: string;
  status: StatusSolicitacaoExclusao;
  observacaoInterna: string;
};

export async function atualizarSolicitacaoExclusaoAdmin({
  id,
  status,
  observacaoInterna,
}: AtualizarSolicitacaoExclusaoAdminParams) {
  const response = await fetch("/api/admin/solicitacoes-exclusao", {
    method: "PATCH",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      id,
      status,
      observacaoInterna,
    }),
  });

  const data =
    (await response.json().catch(() => null)) as
      RespostaAtualizacao | null;

  return { response, data };
}
