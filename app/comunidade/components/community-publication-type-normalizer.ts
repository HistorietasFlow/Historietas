import type { TipoPublicacaoComunidade } from "./community-publication-type";
import { TIPOS_PUBLICACAO_COMUNIDADE } from "./community-publication-types";

export type NormalizarTipoPublicacaoComunidade = (
  valor: unknown
) => TipoPublicacaoComunidade;

export function normalizarTipoPublicacao(valor: unknown): TipoPublicacaoComunidade {
  return TIPOS_PUBLICACAO_COMUNIDADE.includes(valor as TipoPublicacaoComunidade)
    ? (valor as TipoPublicacaoComunidade)
    : "Discussão";
}
