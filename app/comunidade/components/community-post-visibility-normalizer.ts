import type { VisibilidadePostComunidade } from "./community-post-visibility";

export type NormalizarVisibilidadeComunidade = (
  valor: unknown
) => VisibilidadePostComunidade;
