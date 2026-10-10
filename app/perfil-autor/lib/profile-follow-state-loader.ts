import { supabase } from "../../../lib/supabase/client";
import { idAutorSupabaseValido } from "./profile-formatters";

export async function contarSeguimentoUsuarioPerfil(
  coluna: "seguidor_id" | "seguido_id",
  userId: string,
) {
  if (!userId || !idAutorSupabaseValido(userId)) {
    return 0;
  }

  try {
    const { count, error } = await supabase
      .from("seguindo_usuarios")
      .select("id", { count: "exact", head: true })
      .eq(coluna, userId);

    if (error) {
      console.warn("Não consegui contar seguidores do perfil:", error.message);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.warn("Não consegui acessar seguidores do perfil:", error);
    return 0;
  }
}

export async function carregarEstadoSeguimentoUsuarioPerfil(
  seguidorId: string,
  seguidoId: string,
) {
  if (!seguidoId || !idAutorSupabaseValido(seguidoId)) {
    return {
      seguindo: false,
      seguidoresTotal: 0,
      seguindoTotal: 0,
    };
  }

  const [seguidoresTotal, seguindoTotal] = await Promise.all([
    contarSeguimentoUsuarioPerfil("seguido_id", seguidoId),
    contarSeguimentoUsuarioPerfil("seguidor_id", seguidoId),
  ]);

  if (!seguidorId || !idAutorSupabaseValido(seguidorId) || seguidorId === seguidoId) {
    return {
      seguindo: false,
      seguidoresTotal,
      seguindoTotal,
    };
  }

  try {
    const { data, error } = await supabase
      .from("seguindo_usuarios")
      .select("seguidor_id")
      .eq("seguidor_id", seguidorId)
      .eq("seguido_id", seguidoId)
      .maybeSingle();

    if (error) {
      console.warn("Não consegui conferir se você segue este perfil:", error.message);
    }

    return {
      seguindo: !error && Boolean(data),
      seguidoresTotal,
      seguindoTotal,
    };
  } catch (error) {
    console.warn("Não consegui acessar o estado de seguimento do perfil:", error);

    return {
      seguindo: false,
      seguidoresTotal,
      seguindoTotal,
    };
  }
}
