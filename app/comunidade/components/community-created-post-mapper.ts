import { normalizarCategoria } from "./community-category-normalizer";
import type { ComentarioComunidade } from "./community-comment";
import type { PostComunidade } from "./community-post-model";
import { normalizarVisibilidadePostComunidade } from "./community-post-visibility-normalizer";
import { obterAvatarProfileComunidade } from "./community-profile-avatar";
import { obterNomeProfileComunidade } from "./community-profile-name";
import { normalizarTipoPublicacao } from "./community-publication-type-normalizer";
import { mapearPostSupabase } from "./community-supabase-post-mapper";
import type { SupabasePostRow } from "./community-supabase-post-row";
import type { PerfilComunidadeRow } from "./community-supabase-profile-row";

type MapearPostCriadoComunidadeParams = {
  postCriado: SupabasePostRow;
  usuarioAutenticadoId: string;
  autorNomeSeguro: string;
  usuarioAvatar: string;
};

export function mapearPostCriadoComunidade({
  postCriado,
  usuarioAutenticadoId,
  autorNomeSeguro,
  usuarioAvatar,
}: MapearPostCriadoComunidadeParams): PostComunidade {
  const profilesPostNovo = new Map<string, PerfilComunidadeRow>([
    [
      usuarioAutenticadoId,
      {
        nome: autorNomeSeguro,
        avatar_url: usuarioAvatar,
      },
    ],
  ]);

  return mapearPostSupabase(
    postCriado,
    new Map<string, ComentarioComunidade[]>(),
    new Map<string, string[]>(),
    profilesPostNovo,
    obterNomeProfileComunidade,
    obterAvatarProfileComunidade,
    normalizarCategoria,
    normalizarTipoPublicacao,
    normalizarVisibilidadePostComunidade
  );
}
