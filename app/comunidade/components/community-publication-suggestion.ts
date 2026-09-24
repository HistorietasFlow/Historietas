import type { CategoriaComunidade } from "./community-category";
import type { TipoPublicacaoComunidade } from "./community-publication-type";

export type SugestaoPublicacaoComunidade = {
  rotulo: string;
  texto: string;
  categoria: CategoriaComunidade;
  tipo: TipoPublicacaoComunidade;
};
