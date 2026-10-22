import { supabase } from "../../../lib/supabase/client";

export async function carregarNomePerfilPublicar(userId: string, fallback = "") {
  const fallbackLimpo = fallback.trim();

  if (!userId.trim()) {
    return fallbackLimpo;
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("nome")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    const nome = typeof data?.nome === "string" ? data.nome.trim() : "";

    if (!error && nome) {
      return nome;
    }
  } catch {
    // O nome manual/metadata continua disponível se profiles falhar.
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("nome")
      .eq("id", userId)
      .limit(1)
      .maybeSingle();

    const nome = typeof data?.nome === "string" ? data.nome.trim() : "";

    if (!error && nome) {
      return nome;
    }
  } catch {
    // Alguns bancos usam user_id no profiles; esse fallback cobre tabelas antigas.
  }

  return fallbackLimpo;
}


