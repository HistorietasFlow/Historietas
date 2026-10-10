import { supabase } from "../../../lib/supabase/client";
import { idAutorSupabaseValido } from "./profile-formatters";

export async function sincronizarNomeAutorObrasSupabase(userId: string, nome: string) {
  const userIdLimpo = userId.trim();
  const nomeLimpo = nome.trim();

  if (!userIdLimpo || !nomeLimpo || !idAutorSupabaseValido(userIdLimpo)) {
    return { ok: false, erro: "Dados insuficientes para sincronizar obras." };
  }

  try {
    const { error } = await supabase
      .from("obras")
      .update({
        autor: nomeLimpo,
        atualizado_em: new Date().toISOString(),
      })
      .eq("user_id", userIdLimpo);

    if (error) {
      return { ok: false, erro: error.message };
    }

    return { ok: true, erro: "" };
  } catch (error) {
    return {
      ok: false,
      erro: error instanceof Error ? error.message : "Erro inesperado ao sincronizar obras.",
    };
  }
}
