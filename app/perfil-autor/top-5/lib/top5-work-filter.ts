import { normalizarTexto } from "../../../../lib/utils";
import { criarChaveObraTop5 } from "./top5-work-identifiers";
import type { ObraTop5 } from "./top5-types";

export function filtrarObrasTop5(
  obras: ObraTop5[],
  idsSelecionados: string[],
  busca: string,
) {
  const buscaNormalizada = normalizarTexto(busca);

  const idsSelecionadosSet = new Set(idsSelecionados);
  const obrasOrdenadas = [...obras].sort((obraA, obraB) => {
    const selecionadaA = idsSelecionadosSet.has(criarChaveObraTop5(obraA));
    const selecionadaB = idsSelecionadosSet.has(criarChaveObraTop5(obraB));

    if (selecionadaA !== selecionadaB) {
      return Number(selecionadaB) - Number(selecionadaA);
    }

    return obraA.titulo.localeCompare(obraB.titulo, "pt-BR");
  });

  if (!buscaNormalizada) {
    return obrasOrdenadas;
  }

  return obrasOrdenadas.filter((obra) => {
    const textoBusca = normalizarTexto(
      [obra.titulo, obra.autor, obra.genero, obra.formato, ...obra.tags].join(" "),
    );

    return textoBusca.includes(buscaNormalizada);
  });
}
