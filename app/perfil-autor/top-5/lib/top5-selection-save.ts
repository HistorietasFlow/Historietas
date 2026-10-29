import { normalizarIdsSelecionadosTop5 } from "./top5-selection-normalizer";
import { salvarTop5 } from "./top5-selection-storage";
import type { ObraTop5 } from "./top5-types";

export function persistirSelecaoTop5(
  userId: string,
  idsSelecionados: string[],
  obrasDisponiveis: ObraTop5[],
) {
  const idsValidos = normalizarIdsSelecionadosTop5(
    idsSelecionados,
    obrasDisponiveis,
  );

  const salvou = salvarTop5(
    userId,
    idsValidos,
  );

  if (!salvou) {
    throw new Error(
      "Não foi possível gravar o TOP 5 no navegador.",
    );
  }

  return idsValidos;
}
