import type { PerfilComunidadeRow } from "./community-supabase-profile-row";
import { obterTextoProfileComunidade } from "./community-profile-text";

export function obterAvatarProfileComunidade(
  profile: PerfilComunidadeRow | undefined
) {
  return (
    obterTextoProfileComunidade(profile, "avatar_url") ||
    obterTextoProfileComunidade(profile, "avatar") ||
    obterTextoProfileComunidade(profile, "foto_url") ||
    obterTextoProfileComunidade(profile, "imagem_url") ||
    obterTextoProfileComunidade(profile, "photo_url")
  );
}
