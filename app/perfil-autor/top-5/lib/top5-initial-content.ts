import { carregarObrasIniciaisTop5 } from "./top5-initial-works";
import { prepararSelecaoInicialTop5 } from "./top5-initial-selection";
import type { ObraTop5 } from "./top5-types";

export function prepararConteudoInicialTop5(
  userId: string,
  obrasSupabase: ObraTop5[],
) {
  const obrasMescladas = carregarObrasIniciaisTop5(
    userId,
    obrasSupabase,
  );

  const {
    idsSalvos,
    idsNormalizados,
  } = prepararSelecaoInicialTop5(
    userId,
    obrasMescladas,
  );

  return {
    obrasMescladas,
    idsSalvos,
    idsNormalizados,
  };
}
