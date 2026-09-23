import { mapearComentarioSupabase } from "./community-supabase-comment-mapper";
import type { CategoriaComunidade } from "./community-category";
import type { VisibilidadePostComunidade } from "./community-post-visibility";
import type { TipoPublicacaoComunidade } from "./community-publication-type";
import type { SupabaseComentarioRow } from "./community-supabase-comment-row";
import type { SupabaseComentarioCurtidaRow } from "./community-supabase-comment-like-row";
import { mapearPostSupabase } from "./community-supabase-post-mapper";
import type { SupabasePostRow } from "./community-supabase-post-row";
import type { SupabaseCurtidaRow } from "./community-supabase-like-row";
import type { PerfilComunidadeRow } from "./community-supabase-profile-row";

type ComentarioComunidade = {
  id: string;
  autorId: string;
  autorNome: string;
  autorAvatar: string;
  texto: string;
  criadoEm: string;
  comentarioPaiId: string;
  curtidas: string[];
};

type PostComunidade = {
  id: string;
  autorId: string;
  autorNome: string;
  autorAvatar: string;
  categoria: CategoriaComunidade;
  tipoPublicacao: TipoPublicacaoComunidade;
  temSpoiler: boolean;
  texto: string;
  obraRelacionada: string;
  capituloRelacionado: string;
  criadoEm: string;
  fixado: boolean;
  fixadoEm: string;
  fixadoPor: string;
  curtidas: string[];
  comentarios: ComentarioComunidade[];
  visibilidade: VisibilidadePostComunidade;
};

type ObterDadoProfileComunidade = (
  profile: PerfilComunidadeRow | undefined
) => string;

type NormalizarCategoriaComunidade = (
  valor: unknown
) => CategoriaComunidade;

type NormalizarTipoPublicacaoComunidade = (
  valor: unknown
) => TipoPublicacaoComunidade;

type NormalizarVisibilidadeComunidade = (
  valor: unknown
) => VisibilidadePostComunidade;

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
): PostComunidade[] {
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
