import type { PerfilComunidadeRow } from "./community-supabase-profile-row";
import { obterTextoProfileComunidade } from "./community-profile-text";

export function obterUsernameProfileComunidade(
  profile: PerfilComunidadeRow | undefined
) {
  return obterTextoProfileComunidade(profile, "username")
    .replace(/^@+/, "")
    .trim();
}
