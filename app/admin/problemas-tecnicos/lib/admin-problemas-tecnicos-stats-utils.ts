import type { ProblemaTecnico } from "./admin-problemas-tecnicos-normalization-utils";

export function calcularTotaisProblemasTecnicos(problemas: ProblemaTecnico[]) {
  return {
    total: problemas.length,
    abertos: problemas.filter((item) => item.status === "aberto").length,
    analise: problemas.filter((item) => item.status === "em_analise").length,
    aguardando: problemas.filter(
      (item) => item.status === "aguardando_usuario",
    ).length,
    urgentes: problemas.filter((item) => item.prioridade === "urgente").length,
  };
}
