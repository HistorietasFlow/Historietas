import { supabase } from "../../../lib/supabase/client";
import { carregarTodasPaginasSupabase } from "../../../lib/supabase/paginacao.mjs";
import { normalizarListaIdsEmAlta } from "./em-alta-ranking-list-utils";

export async function carregarIdsColecaoUsuarioSupabaseEmAlta(
  tabela: "favoritos" | "concluidas",
  userId: string,
) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [] as string[];
  }

  try {
    const data = await carregarTodasPaginasSupabase<{ obra_id: string }>({
      nomeColecao: `${tabela} do Em Alta`,
      buscarPagina: async (inicio, fim) =>
        supabase
          .from(tabela)
          .select("obra_id")
          .eq("user_id", userIdLimpo)
          .order("obra_id", { ascending: true })
          .range(inicio, fim),
    });

    return normalizarListaIdsEmAlta(
      data.map((registro) => {
        if (
          !registro ||
          typeof registro !== "object" ||
          Array.isArray(registro)
        ) {
          return "";
        }

        const obraId = (registro as Record<string, unknown>).obra_id;

        return typeof obraId === "string" ? obraId : "";
      }),
    );
  } catch (error) {
    console.warn(`Não consegui acessar ${tabela} no Em Alta:`, error);
    return [] as string[];
  }
}
