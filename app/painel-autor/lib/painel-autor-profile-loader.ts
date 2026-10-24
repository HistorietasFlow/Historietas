import { supabase } from "../../../lib/supabase/client";

type ProfilePainelAutorRow = {
  id?: string | null;
  user_id?: string | null;
  nome?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  sobre_bio?: string | null;
};

export async function carregarProfilePainelAutor(userId: string) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return null as ProfilePainelAutorRow | null;
  }

  try {
    const camposProfile = "id, user_id, nome, avatar_url, bio, sobre_bio";
    const { data: profilePorUserId, error: erroUserId } = await supabase
      .from("profiles_publicos")
      .select(camposProfile)
      .eq("user_id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (!erroUserId && profilePorUserId) {
      return profilePorUserId as ProfilePainelAutorRow;
    }

    const { data: profilePorId, error: erroId } = await supabase
      .from("profiles_publicos")
      .select(camposProfile)
      .eq("id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (!erroId && profilePorId) {
      return profilePorId as ProfilePainelAutorRow;
    }
  } catch {
    // O perfil público é uma camada social. O painel continua com os dados da obra.
  }

  return null;
}
