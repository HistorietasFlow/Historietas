import type { CategoriaComunidade } from "./community-category";
import { CATEGORIAS_COMUNIDADE } from "./community-categories";

export type NormalizarCategoriaComunidade = (
  valor: unknown
) => CategoriaComunidade;

export function normalizarCategoria(valor: unknown): CategoriaComunidade {
  return CATEGORIAS_COMUNIDADE.includes(valor as CategoriaComunidade)
    ? (valor as CategoriaComunidade)
    : "Geral";
}
