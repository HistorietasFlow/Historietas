import { supabase } from "../../lib/supabase/client";
import { carregarTodasPaginasSupabase } from "../../lib/supabase/paginacao.mjs";
import { idObraSupabaseValido } from "../../lib/utils";
import { normalizarListaIdsHome } from "./home-collection-utils";

type TabelaColecaoHome = "favoritos" | "concluidas";

export async function carregarIdsColecaoUsuarioHome(
  tabela: TabelaColecaoHome,
  userId: string
) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [] as string[];
  }

  try {
    const data = await carregarTodasPaginasSupabase<{ obra_id: string }>({
      nomeColecao: `${tabela} da Home`,
      buscarPagina: async (inicio, fim) =>
        supabase
          .from(tabela)
          .select("obra_id")
          .eq("user_id", userIdLimpo)
          .order("obra_id", { ascending: true })
          .range(inicio, fim),
    });

    return normalizarListaIdsHome(
      data
        .map((registro: unknown) => {
          if (!registro || typeof registro !== "object" || Array.isArray(registro)) {
            return "";
          }

          const obraId = (registro as { obra_id?: unknown }).obra_id;

          return typeof obraId === "string" ? obraId : "";
        })
        .filter(Boolean)
    );
  } catch {
    return [] as string[];
  }
}

export async function sincronizarColecaoObraHome(
  tabela: TabelaColecaoHome,
  obraId: string,
  ativo: boolean
) {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || "";

    if (!userId || !idObraSupabaseValido(obraId)) {
      return false;
    }

    const { error: erroDelete } = await supabase
      .from(tabela)
      .delete()
      .eq("user_id", userId)
      .eq("obra_id", obraId);

    if (erroDelete) {
      throw erroDelete;
    }

    if (!ativo) {
      return true;
    }

    const payloadBase = {
      user_id: userId,
      obra_id: obraId,
    };

    const { error: erroComVisibilidade } = await supabase.from(tabela).insert({
      ...payloadBase,
      visibilidade: "parcial",
    });

    if (!erroComVisibilidade) {
      return true;
    }

    const { error: erroSemVisibilidade } = await supabase
      .from(tabela)
      .insert(payloadBase);

    if (erroSemVisibilidade) {
      throw erroSemVisibilidade;
    }

    return true;
  } catch (error) {
    console.warn(`Não consegui sincronizar ${tabela} na Home:`, error);
    return false;
  }
}
