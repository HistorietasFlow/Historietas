import { calcularTotalVotosEnquete } from "./community-poll-total-votes";

export function calcularPorcentagemOpcaoEnquete(
  resultados: Record<string, Record<string, number>>,
  postId: string,
  opcao: string
) {
  const total = calcularTotalVotosEnquete(resultados, postId);

  if (total <= 0) {
    return 0;
  }

  const quantidade = resultados[postId]?.[opcao] || 0;

  return Math.round((quantidade / total) * 100);
}
