import type { ComentarioComunidade } from "./community-comment";
import { obterAvatarProfileComunidade } from "./community-profile-avatar";
import { obterNomeProfileComunidade } from "./community-profile-name";
import { mapearComentarioSupabase } from "./community-supabase-comment-mapper";
import type { SupabaseComentarioRow } from "./community-supabase-comment-row";
import type { PerfilComunidadeRow } from "./community-supabase-profile-row";

type MapearComentarioCriadoComunidadeParams = {
  comentarioCriado: SupabaseComentarioRow;
  usuarioId: string;
  autorNomeSeguro: string;
  usuarioAvatar: string;
};

export function mapearComentarioCriadoComunidade({
  comentarioCriado,
  usuarioId,
  autorNomeSeguro,
  usuarioAvatar,
}: MapearComentarioCriadoComunidadeParams): ComentarioComunidade {
  const profilesComentarioNovo = new Map<string, PerfilComunidadeRow>([
    [
      usuarioId,
      {
        nome: autorNomeSeguro,
        avatar_url: usuarioAvatar,
      },
    ],
  ]);

  return mapearComentarioSupabase(
    comentarioCriado,
    new Map<string, string[]>(),
    profilesComentarioNovo,
    obterNomeProfileComunidade,
    obterAvatarProfileComunidade
  );
}
