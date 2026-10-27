export type RespostaOperacoes = {
  ok?: boolean;
  codigo?: string;
  mensagem?: string;
  operacoes?: unknown[];
};

export async function buscarOperacoesRecuperaveisAdmin() {
  const response = await fetch("/api/admin/operacoes-exclusao", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  const data =
    (await response.json().catch(() => null)) as
      RespostaOperacoes | null;

  return { response, data };
}
