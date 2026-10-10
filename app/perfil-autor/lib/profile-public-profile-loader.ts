import { supabase } from "../../../lib/supabase/client";
import type { PerfilUsuarioRemoto } from "../types";
import { normalizarPerfilUsuarioSupabase } from "./data-normalizers";
import { idAutorSupabaseValido } from "./profile-formatters";

export async function carregarPerfilUsuarioSupabase(
  userId: string,
  nomeFallback: string,
): Promise<PerfilUsuarioRemoto | null> {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo || !idAutorSupabaseValido(userIdLimpo)) {
    return null;
  }

  async function buscarPerfilPorCampo(campo: "user_id" | "id") {
    const { data, error } = await supabase
      .from("profiles_publicos")
      .select("id,user_id,nome,avatar_url,bio,sobre_bio,criado_em,username")
      .eq(campo, userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data && typeof data === "object" && !Array.isArray(data)) {
      return data as Record<string, unknown>;
    }

    return null;
  }

  const perfilPorUserId = await buscarPerfilPorCampo("user_id");
  const perfilEncontrado =
    perfilPorUserId || (await buscarPerfilPorCampo("id"));

  return normalizarPerfilUsuarioSupabase(
    perfilEncontrado,
    userIdLimpo,
    nomeFallback,
  );
}
