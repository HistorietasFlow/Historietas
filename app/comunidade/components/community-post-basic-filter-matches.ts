import { normalizarTexto } from "../../../lib/utils";
import type { CategoriaComunidade } from "./community-category";
import type { AbaFeedComunidade } from "./community-feed-tab";
import type { PostComunidade } from "./community-post-model";
import type { TipoPublicacaoFiltro } from "./community-publication-filter";
import type { GrupoPublicacaoObra } from "./community-publication-group";
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

export function postCombinaGrupoPublicacaoComunidade(
  tipoVisualPublicacao: TipoPublicacaoComunidade,
  grupoPublicacaoObra: GrupoPublicacaoObra
) {
  return (
    grupoPublicacaoObra !== "posts" ||
    (tipoVisualPublicacao !== "Teoria" && tipoVisualPublicacao !== "Review")
  );
}

export function postCombinaAbaFeedComunidade(
  post: PostComunidade,
  tipoVisualPublicacao: TipoPublicacaoComunidade,
  abaFeedAtiva: AbaFeedComunidade,
  usuariosSeguidosIds: string[]
) {
  return abaFeedAtiva === "Seguindo"
    ? usuariosSeguidosIds.includes(post.autorId)
    : abaFeedAtiva === "Teorias"
      ? tipoVisualPublicacao === "Teoria"
      : abaFeedAtiva === "Reviews"
        ? tipoVisualPublicacao === "Review"
        : true;
}
