import { supabase } from "../../../lib/supabase/client";
import { obterNomeProfileEditarCapitulo } from "../lib/editar-capitulo-profile-utils";

export async function carregarNomeProfileEditarCapitulo(userId: string) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return "";
  }

  try {
    const { data: profilePorUserId, error: erroPorUserId } = await supabase
      .from("profiles")
      .select("nome")
      .eq("user_id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (!erroPorUserId) {
      const nome = obterNomeProfileEditarCapitulo(profilePorUserId);

      if (nome) {
        return nome;
      }
    }

    const { data: profilePorId, error: erroPorId } = await supabase
      .from("profiles")
      .select("nome")
      .eq("id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (!erroPorId) {
      return obterNomeProfileEditarCapitulo(profilePorId);
    }
  } catch (error) {
    console.warn("Não consegui carregar profiles.nome no Editor de Capítulo:", error);
  }

  return "";
}
