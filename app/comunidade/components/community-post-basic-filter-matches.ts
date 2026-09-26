import { normalizarTexto } from "../../../lib/utils";
import type { CategoriaComunidade } from "./community-category";
import type { PostComunidade } from "./community-post-model";
import type { TipoPublicacaoFiltro } from "./community-publication-filter";
import type { TipoPublicacaoComunidade } from "./community-publication-type";

export function postCombinaCategoriaComunidade(
  post: PostComunidade,
  categoriaAtiva: CategoriaComunidade | "Todos"
) {
  return categoriaAtiva === "Todos" || post.categoria === categoriaAtiva;
}

export function postCombinaTipoPublicacaoComunidade(
  tipoVisualPublicacao: TipoPublicacaoComunidade,
  tipoPublicacaoAtiva: TipoPublicacaoFiltro
) {
  return (
    tipoPublicacaoAtiva === "Todos" ||
    tipoVisualPublicacao === tipoPublicacaoAtiva
  );
}

export function postCombinaObraRelacionadaComunidade(
  post: PostComunidade,
  obraRelacionadaFiltro: string
) {
  return (
    !obraRelacionadaFiltro.trim() ||
    normalizarTexto(post.obraRelacionada) ===
      normalizarTexto(obraRelacionadaFiltro)
  );
}
