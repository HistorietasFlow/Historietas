import { separarObraECapituloRelacionados } from "./community-related-chapter-utils";
import type { SupabasePostRow } from "./community-supabase-post-row";

type CategoriaComunidade =
  | "Geral"
  | "Divulgação"
  | "Recomendações"
  | "Discussão"
  | "Dúvidas";

type TipoPublicacaoComunidade =
  | "Discussão"
  | "Teoria"
  | "Enquete"
  | "Pedido de indicação"
  | "Divulgação"
  | "Review"
  | "Aviso de capítulo"
  | "Dúvida";

type VisibilidadePostComunidade =
  | "publico"
  | "seguidores"
  | "seguindo"
  | "somente_eu";

type PerfilComunidadeRow = Record<string, unknown>;

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
): PostComunidade {
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
