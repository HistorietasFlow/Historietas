import { supabase } from "../../../lib/supabase/client";
import { idSupabaseValidoComunidade } from "./community-supabase-id-validator";

type PerfilComunidadeRow = Record<string, unknown>;

type ObterTextoProfileComunidade = (
  profile: PerfilComunidadeRow | undefined,
  chave: string
) => string;

export async function carregarProfilesComunidadePorUsuarios(
  userIds: string[],
  obterTextoProfileComunidade: ObterTextoProfileComunidade
) {
  const idsValidos = Array.from(
    new Set(
      userIds
        .map((id) => id.trim())
        .filter((id) => idSupabaseValidoComunidade(id))
    )
  );
  const profilesPorUsuario = new Map<string, PerfilComunidadeRow>();

  if (idsValidos.length === 0) {
    return profilesPorUsuario;
  }

  try {
    const { data } = await supabase
      .from("profiles")
      .select("id,user_id,nome,avatar_url")
      .in("user_id", idsValidos)
      .limit(1000);

    if (Array.isArray(data)) {
      data.forEach((profile) => {
        const profileUserId = obterTextoProfileComunidade(profile, "user_id");

        if (profileUserId) {
          profilesPorUsuario.set(profileUserId, profile);
        }
      });
    }
  } catch {
    // Algumas bases antigas usam id no lugar de user_id. O fallback vem abaixo.
  }

  const idsSemProfile = idsValidos.filter(
    (userId) => !profilesPorUsuario.has(userId)
  );

  if (idsSemProfile.length > 0) {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id,user_id,nome,avatar_url")
        .in("id", idsSemProfile)
        .limit(1000);

      if (Array.isArray(data)) {
        data.forEach((profile) => {
          const profileUserId =
            obterTextoProfileComunidade(profile, "user_id") ||
            obterTextoProfileComunidade(profile, "id");

          if (profileUserId) {
            profilesPorUsuario.set(profileUserId, profile);
          }
        });
      }
    } catch {
      // Profiles é complementar; a Comunidade segue com o nome salvo no post.
    }
  }

  return profilesPorUsuario;
}
