import type { ComentarioComunidade } from "./community-comment";
import type { ObterDadoProfileComunidade } from "./community-profile-data-getter";
import type { SupabaseComentarioRow } from "./community-supabase-comment-row";
import type { PerfilComunidadeRow } from "./community-supabase-profile-row";

export function mapearComentarioSupabase(
  comentario: SupabaseComentarioRow,
  curtidasPorComentario: Map<string, string[]>,
  profilesPorUsuario = new Map<string, PerfilComunidadeRow>(),
  obterNomeProfileComunidade: ObterDadoProfileComunidade,
  obterAvatarProfileComunidade: ObterDadoProfileComunidade
): ComentarioComunidade {
  const profile = profilesPorUsuario.get(comentario.autor_id);
  const autorNome =
    obterNomeProfileComunidade(profile) || comentario.autor_nome?.trim() || "Usuário";

  return {
    id: comentario.id,
    autorId: comentario.autor_id,
    autorNome,
    autorAvatar: obterAvatarProfileComunidade(profile),
    texto: comentario.texto.trim().slice(0, 420),
    criadoEm: comentario.criado_em,
    comentarioPaiId: comentario.comentario_pai_id?.trim() || "",
    curtidas: curtidasPorComentario.get(comentario.id) || [],
  };
}
