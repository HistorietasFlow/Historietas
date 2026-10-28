import { supabase } from "../../../lib/supabase/client";
import { carregarTodasPaginasSupabase } from "../../../lib/supabase/paginacao.mjs";
import { normalizarListaIdsEmBreve } from "../lib/em-breve-work-list-utils";

export async function carregarLancamentosSalvosSupabaseEmBreve(userId: string) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [] as string[];
  }

  try {
    const data = await carregarTodasPaginasSupabase<{ obra_id: string }>({
      nomeColecao: "avisos reais do Em breve",
      buscarPagina: async (inicio, fim) =>
        supabase
          .from("seguindo_obras")
          .select("obra_id")
          .eq("user_id", userIdLimpo)
          .order("obra_id", { ascending: true })
          .range(inicio, fim),
    });

    return normalizarListaIdsEmBreve(
      data.map((registro) => {
        if (!registro || typeof registro !== "object" || Array.isArray(registro)) {
          return "";
        }

        const obraId = (registro as Record<string, unknown>).obra_id;

        return typeof obraId === "string" ? obraId : "";
      })
    );
  } catch (error) {
    console.warn("Não consegui acessar seguindo_obras no Em breve:", error);
    return [] as string[];
  }
}
