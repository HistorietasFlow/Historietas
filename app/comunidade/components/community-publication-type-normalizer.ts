import type { TipoPublicacaoComunidade } from "./community-publication-type";

export type NormalizarTipoPublicacaoComunidade = (
  valor: unknown
) => TipoPublicacaoComunidade;
