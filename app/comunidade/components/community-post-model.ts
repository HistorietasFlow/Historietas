import type { CategoriaComunidade } from "./community-category";
import type { PostComunidade as PostComunidadeBase } from "./community-post";
import type { VisibilidadePostComunidade } from "./community-post-visibility";
import type { TipoPublicacaoComunidade } from "./community-publication-type";

export type PostComunidade = PostComunidadeBase<
  CategoriaComunidade,
  TipoPublicacaoComunidade,
  VisibilidadePostComunidade
>;
