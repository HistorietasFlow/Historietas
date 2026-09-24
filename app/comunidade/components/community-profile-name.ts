import type { PerfilComunidadeRow } from "./community-supabase-profile-row";
import { obterTextoProfileComunidade } from "./community-profile-text";

export function obterNomeProfileComunidade(
  profile: PerfilComunidadeRow | undefined
) {
  return (
    obterTextoProfileComunidade(profile, "nome") ||
    obterTextoProfileComunidade(profile, "username")
  );
}
