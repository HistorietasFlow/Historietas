import { mapearComentarioSupabase } from "./community-supabase-comment-mapper";
import type { CategoriaComunidade } from "./community-category";
import type { NormalizarCategoriaComunidade } from "./community-category-normalizer";
import type { ComentarioComunidade } from "./community-comment";
import type { PostComunidade } from "./community-post";
import type { VisibilidadePostComunidade } from "./community-post-visibility";
import type { NormalizarVisibilidadeComunidade } from "./community-post-visibility-normalizer";
import type { ObterDadoProfileComunidade } from "./community-profile-data-getter";
import type { TipoPublicacaoComunidade } from "./community-publication-type";
import type { NormalizarTipoPublicacaoComunidade } from "./community-publication-type-normalizer";
import type { SupabaseComentarioRow } from "./community-supabase-comment-row";
import type { SupabaseComentarioCurtidaRow } from "./community-supabase-comment-like-row";
import { mapearPostSupabase } from "./community-supabase-post-mapper";
import type { SupabasePostRow } from "./community-supabase-post-row";
import type { SupabaseCurtidaRow } from "./community-supabase-like-row";
import type { PerfilComunidadeRow } from "./community-supabase-profile-row";

export function mapearPostsSupabase(
  postsSupabase: SupabasePostRow[],
  comentariosSupabase: SupabaseComentarioRow[],
  curtidasSupabase: SupabaseCurtidaRow[],
  comentarioCurtidasSupabase: SupabaseComentarioCurtidaRow[],
  profilesPorUsuario = new Map<string, PerfilComunidadeRow>(),
  obterNomeProfileComunidade: ObterDadoProfileComunidade,
  obterAvatarProfileComunidade: ObterDadoProfileComunidade,
  normalizarCategoria: NormalizarCategoriaComunidade,
  normalizarTipoPublicacao: NormalizarTipoPublicacaoComunidade,
  normalizarVisibilidadePostComunidade: NormalizarVisibilidadeComunidade
): Array<
  PostComunidade<
    CategoriaComunidade,
    TipoPublicacaoComunidade,
    VisibilidadePostComunidade
  >
> {
  const comentariosPorPost = new Map<string, ComentarioComunidade[]>();
  const curtidasPorPost = new Map<string, string[]>();
  const curtidasPorComentario = new Map<string, string[]>();

  comentarioCurtidasSupabase.forEach((curtida) => {
    const curtidasAtuais = curtidasPorComentario.get(curtida.comentario_id) || [];

    if (!curtidasAtuais.includes(curtida.usuario_id)) {
      curtidasPorComentario.set(curtida.comentario_id, [
        ...curtidasAtuais,
        curtida.usuario_id,
      ]);
    }
  });

  comentariosSupabase.forEach((comentarioSupabase) => {
    const comentario = mapearComentarioSupabase(
      comentarioSupabase,
      curtidasPorComentario,
      profilesPorUsuario,
      obterNomeProfileComunidade,
      obterAvatarProfileComunidade
    );
    const comentariosAtuais =
      comentariosPorPost.get(comentarioSupabase.post_id) || [];

    comentariosPorPost.set(comentarioSupabase.post_id, [
      ...comentariosAtuais,
      comentario,
    ]);
  });

  curtidasSupabase.forEach((curtida) => {
    const curtidasAtuais = curtidasPorPost.get(curtida.post_id) || [];

    if (!curtidasAtuais.includes(curtida.usuario_id)) {
      curtidasPorPost.set(curtida.post_id, [
        ...curtidasAtuais,
        curtida.usuario_id,
      ]);
    }
  });

  return postsSupabase.map((post) =>
    mapearPostSupabase(
      post,
      comentariosPorPost,
      curtidasPorPost,
      profilesPorUsuario,
      obterNomeProfileComunidade,
      obterAvatarProfileComunidade,
      normalizarCategoria,
      normalizarTipoPublicacao,
      normalizarVisibilidadePostComunidade
    )
  );
}
