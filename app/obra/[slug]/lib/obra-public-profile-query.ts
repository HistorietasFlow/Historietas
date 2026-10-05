import { supabase } from "../../../../lib/supabase/client";

const SELECOES_PERFIS_PUBLICOS = [
  "id,user_id,nome,avatar_url,bio",
  "id,user_id,nome,avatar_url",
  "id,user_id,nome",
];

export async function consultarPerfisPublicosObraPorCampo(
  ids: string[],
  campo: "user_id" | "id",
): Promise<Record<string, unknown>[]> {
  for (const campos of SELECOES_PERFIS_PUBLICOS) {
    try {
      const { data, error } = await supabase
        .from("profiles_publicos")
        .select(campos)
        .in(campo, ids)
        .limit(1000);

      if (error || !Array.isArray(data)) {
        continue;
      }

      return data as unknown as Record<string, unknown>[];
    } catch {
      // Tenta uma seleção menor abaixo.
    }
  }

  return [];
}
