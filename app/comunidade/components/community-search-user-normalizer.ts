import type { PerfilComunidadeRow } from "./community-supabase-profile-row";
import type { UsuarioBuscaComunidade } from "./community-user";
import { obterTextoProfileComunidade } from "./community-profile-text";
import { obterNomeProfileComunidade } from "./community-profile-name";
import { obterAvatarProfileComunidade } from "./community-profile-avatar";
import { obterUsernameProfileComunidade } from "./community-profile-username";
import { idSupabaseValidoComunidade } from "./community-supabase-id-validator";

export function normalizarUsuarioBuscaComunidade(
  profile: PerfilComunidadeRow
): UsuarioBuscaComunidade | null {
  const id =
    obterTextoProfileComunidade(profile, "user_id") ||
    obterTextoProfileComunidade(profile, "id");
  const nome = obterNomeProfileComunidade(profile);

  if (!idSupabaseValidoComunidade(id) || !nome) {
    return null;
  }

  return {
    id,
    nome: nome.slice(0, 80),
    username: obterUsernameProfileComunidade(profile).slice(0, 80),
    avatar: obterAvatarProfileComunidade(profile),
  };
}
