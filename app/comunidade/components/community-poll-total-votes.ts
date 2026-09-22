export function calcularTotalVotosEnquete(
  resultados: Record<string, Record<string, number>>,
  postId: string
) {
  return Object.values(resultados[postId] || {}).reduce((total, quantidade) => {
    return total + quantidade;
  }, 0);
}
