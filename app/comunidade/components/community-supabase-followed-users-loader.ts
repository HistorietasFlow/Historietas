import { supabase } from "../../../lib/supabase/client";
import { idSupabaseValidoComunidade } from "./community-supabase-id-validator";

export async function carregarUsuariosSeguidosComunidade(seguidorId: string) {
  const seguidorIdLimpo = seguidorId.trim();

  if (!idSupabaseValidoComunidade(seguidorIdLimpo)) {
    return [] as string[];
  }

  try {
    const { data, error } = await supabase
      .from("seguindo_usuarios")
      .select("seguido_id")
      .eq("seguidor_id", seguidorIdLimpo)
      .limit(5000);

    if (error || !Array.isArray(data)) {
      return [] as string[];
    }

    return Array.from(
      new Set(
        data
          .map((registro) => registro.seguido_id?.trim() || "")
          .filter((id) => idSupabaseValidoComunidade(id))
      )
    );
  } catch {
    return [] as string[];
  }
}
