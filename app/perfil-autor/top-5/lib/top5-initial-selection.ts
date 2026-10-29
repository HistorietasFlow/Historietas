import { normalizarIdsSelecionadosTop5 } from "./top5-selection-normalizer";
import { carregarTop5Salvo } from "./top5-selection-storage";
import type { ObraTop5 } from "./top5-types";

export function prepararSelecaoInicialTop5(
  userId: string,
  obrasDisponiveis: ObraTop5[],
) {
  const idsSalvos = userId
    ? carregarTop5Salvo(userId)
    : [];

  const idsNormalizados = normalizarIdsSelecionadosTop5(
    idsSalvos,
    obrasDisponiveis,
  );

  return {
    idsSalvos,
    idsNormalizados,
  };
}
