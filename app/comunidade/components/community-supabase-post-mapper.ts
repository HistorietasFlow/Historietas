import { separarObraECapituloRelacionados } from "./community-related-chapter-utils";
import type { CategoriaComunidade } from "./community-category";
import type { ComentarioComunidade } from "./community-comment";
import type { PostComunidade } from "./community-post";
import type { VisibilidadePostComunidade } from "./community-post-visibility";
import type { TipoPublicacaoComunidade } from "./community-publication-type";
import type { SupabasePostRow } from "./community-supabase-post-row";
import type { PerfilComunidadeRow } from "./community-supabase-profile-row";

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

export function mapearPostSupabase(
  post: SupabasePostRow,
  comentariosPorPost: Map<string, ComentarioComunidade[]>,
  curtidasPorPost: Map<string, string[]>,
  profilesPorUsuario = new Map<string, PerfilComunidadeRow>(),
  obterNomeProfileComunidade: ObterDadoProfileComunidade,
  obterAvatarProfileComunidade: ObterDadoProfileComunidade,
  normalizarCategoria: NormalizarCategoriaComunidade,
  normalizarTipoPublicacao: NormalizarTipoPublicacaoComunidade,
  normalizarVisibilidadePostComunidade: NormalizarVisibilidadeComunidade
): PostComunidade<
  CategoriaComunidade,
  TipoPublicacaoComunidade,
  VisibilidadePostComunidade
> {
  const profile = profilesPorUsuario.get(post.autor_id);
  const autorNome =
    obterNomeProfileComunidade(profile) || post.autor_nome?.trim() || "Usuário";
  const relacaoPublicacao = separarObraECapituloRelacionados(
    post.obra_relacionada || "",
  );

  return {
    id: post.id,
    autorId: post.autor_id,
    autorNome,
    autorAvatar: obterAvatarProfileComunidade(profile),
    categoria: normalizarCategoria(post.categoria),
    tipoPublicacao: normalizarTipoPublicacao(post.tipo_publicacao),
    temSpoiler: Boolean(post.tem_spoiler),
    texto: post.texto.trim().slice(0, 700),
    obraRelacionada: relacaoPublicacao.obraRelacionada,
    capituloRelacionado: relacaoPublicacao.capituloRelacionado,
    criadoEm: post.criado_em,
    fixado: Boolean(post.fixado),
    fixadoEm: post.fixado_em || "",
    fixadoPor: post.fixado_por || "",
    curtidas: curtidasPorPost.get(post.id) || [],
    comentarios: comentariosPorPost.get(post.id) || [],
    visibilidade: normalizarVisibilidadePostComunidade(post.visibilidade),
  };
}
