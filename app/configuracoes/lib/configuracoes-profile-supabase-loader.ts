import { supabase } from "../../../lib/supabase/client";
import { idUsuarioSupabaseValido } from "./configuracoes-account-utils";
import type { PerfilConfiguracoesSupabase } from "./configuracoes-account-models";
import { normalizarPerfilConfiguracoesSupabase } from "./configuracoes-profile-utils";

export async function carregarPerfilConfiguracoesSupabase(
  userId: string,
): Promise<PerfilConfiguracoesSupabase | null> {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo || !idUsuarioSupabaseValido(userIdLimpo)) {
    return null;
  }

  try {
    const { data: perfilPorUserId, error: erroUserId } = await supabase
      .from("profiles")
      .select("id,user_id,nome,username")
      .eq("user_id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (
      !erroUserId &&
      perfilPorUserId &&
      typeof perfilPorUserId === "object" &&
      !Array.isArray(perfilPorUserId)
    ) {
      return normalizarPerfilConfiguracoesSupabase(
        perfilPorUserId as Record<string, unknown>,
      );
    }

    const { data: perfilPorId, error: erroId } = await supabase
      .from("profiles")
      .select("id,user_id,nome,username")
      .eq("id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (
      erroId ||
      !perfilPorId ||
      typeof perfilPorId !== "object" ||
      Array.isArray(perfilPorId)
    ) {
      return null;
    }

    return normalizarPerfilConfiguracoesSupabase(
      perfilPorId as Record<string, unknown>,
    );
  } catch {
    return null;
  }
}
