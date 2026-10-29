import {
  criarChaveObraTop5,
  obterIdentificadoresObraTop5,
} from "./top5-work-identifiers";
import { TOP_FIVE_MAXIMO } from "./top5-selection-storage";
import type { ObraTop5 } from "./top5-types";

export function normalizarIdsSelecionadosTop5(
  ids: string[],
  obrasDisponiveis: ObraTop5[],
) {
  const obrasPorIdentificador = new Map<string, ObraTop5>();

  obrasDisponiveis.forEach((obra) => {
    obterIdentificadoresObraTop5(obra).forEach((identificador) => {
      obrasPorIdentificador.set(identificador, obra);
    });
  });

  const idsNormalizados: string[] = [];
  const chavesUsadas = new Set<string>();

  ids.forEach((id) => {
    const obra = obrasPorIdentificador.get(id.trim());

    if (!obra) {
      return;
    }

    const chaveCanonica = criarChaveObraTop5(obra);

    if (!chaveCanonica || chavesUsadas.has(chaveCanonica)) {
      return;
    }

    chavesUsadas.add(chaveCanonica);
    idsNormalizados.push(chaveCanonica);
  });

  return idsNormalizados.slice(0, TOP_FIVE_MAXIMO);
}
