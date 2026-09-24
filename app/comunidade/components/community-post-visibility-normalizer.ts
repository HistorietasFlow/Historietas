import type { VisibilidadePostComunidade } from "./community-post-visibility";
import { VISIBILIDADES_POST_COMUNIDADE } from "./community-post-visibility-options";

export type NormalizarVisibilidadeComunidade = (
  valor: unknown
) => VisibilidadePostComunidade;

export function normalizarVisibilidadePostComunidade(
  valor: unknown,
): VisibilidadePostComunidade {
  return VISIBILIDADES_POST_COMUNIDADE.some((opcao) => opcao.valor === valor)
    ? (valor as VisibilidadePostComunidade)
    : "publico";
}
