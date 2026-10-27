export type RespostaRecuperacao = {
  ok?: boolean;
  codigo?: string;
  mensagem?: string;
  exclusaoConcluida?: boolean;
  acompanhamentoPendente?: boolean;
  operacaoId?: string;
  statusOperacao?: string;
};

export async function recuperarOperacaoExclusaoAdmin({ id }: { id: string }) {
  const response = await fetch("/api/admin/operacoes-exclusao", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ id }),
  });

  const data =
    (await response.json().catch(() => null)) as
      RespostaRecuperacao | null;

  return { response, data };
}
