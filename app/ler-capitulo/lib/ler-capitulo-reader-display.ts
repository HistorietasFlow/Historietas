import {
  criarSlugBase,
  formatarData,
} from "../../../lib/utils";

import type {
  CapituloLocal,
  ObraLocal,
} from "./ler-capitulo-work-normalization";

export function criarVoltarHrefLeitor(
  obra: Pick<
    ObraLocal,
    "slug" | "titulo"
  >,
) {
  return `/obra/${
    obra.slug ||
    criarSlugBase(obra.titulo)
  }`;
}

export function criarStatusLeituraTexto(
  capitulo: Pick<
    CapituloLocal,
    "lido" | "lidoEm"
  >,
) {
  return capitulo.lido
    ? capitulo.lidoEm
      ? `Lido em ${formatarData(
          capitulo.lidoEm,
        )}`
      : "Lido"
    : "Leitura em andamento";
}
