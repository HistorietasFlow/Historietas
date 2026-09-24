import { supabase } from "../../../lib/supabase/client";
import { extrairPostIdSalvoComunidade } from "./community-saved-post-id-extractor";
import { erroTabelaOpcionalComunidadeIgnoravel } from "./community-supabase-optional-table-error-check";

export async function carregarPostsSalvosSupabaseComunidade(userId: string) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return null as string[] | null;
  }

  const tabelas = ["comunidade_salvos", "comunidade_post_salvos"] as const;

  for (const tabela of tabelas) {
    try {
      const { data, error } = await supabase
        .from(tabela)
        .select("post_id")
        .eq("user_id", userIdLimpo)
        .limit(5000);

      if (error) {
        if (erroTabelaOpcionalComunidadeIgnoravel(error)) {
          continue;
        }

        return null;
      }

      if (!Array.isArray(data)) {
        return [] as string[];
      }

      return Array.from(
        new Set(
          (data as Record<string, unknown>[])
            .map((registro) => extrairPostIdSalvoComunidade(registro))
            .filter(Boolean)
        )
      );
    } catch {
      continue;
    }
  }

  return null;
}
