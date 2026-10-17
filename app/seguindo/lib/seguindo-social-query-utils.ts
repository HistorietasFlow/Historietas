import { supabase } from "../../../lib/supabase/client";
import {
  normalizarRegistrosSupabaseGenericos,
  obterTextoRegistro,
} from "./seguindo-record-utils";
import { idUsuarioSupabaseValido } from "./seguindo-route-utils";

export async function carregarIdsSolicitacoesEnviadasSupabase(userId: string) {
  const userIdLimpo = userId.trim();

  if (!idUsuarioSupabaseValido(userIdLimpo)) {
    return [] as string[];
  }

  try {
    const { data, error } = await supabase
      .from("solicitacoes_seguidores")
      .select("destinatario_id")
      .eq("solicitante_id", userIdLimpo)
      .limit(240);

    if (error || !Array.isArray(data)) {
      return [] as string[];
    }

    return Array.from(
      new Set(
        normalizarRegistrosSupabaseGenericos(data)
          .map((registro) => obterTextoRegistro(registro, "destinatario_id"))
          .filter((destinatarioId) => idUsuarioSupabaseValido(destinatarioId)),
      ),
    );
  } catch {
    return [] as string[];
  }
}
