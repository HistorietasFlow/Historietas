export type RespostaLista = {
  ok?: boolean;
  codigo?: string;
  mensagem?: string;
  solicitacoes?: unknown[];
};

export async function buscarSolicitacoesExclusaoAdmin() {
  const response = await fetch("/api/admin/solicitacoes-exclusao", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  const data = (await response.json().catch(() => null)) as RespostaLista | null;

  return { response, data };
}
