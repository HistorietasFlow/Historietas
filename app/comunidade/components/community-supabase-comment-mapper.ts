import type { SupabaseComentarioRow } from "./community-supabase-comment-row";

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

type ObterDadoProfileComunidade = (
  profile: PerfilComunidadeRow | undefined
) => string;

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
