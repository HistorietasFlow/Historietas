import { supabase } from "../../../lib/supabase/client";
import { carregarTodasPaginasSupabase } from "../../../lib/supabase/paginacao.mjs";

export type CapituloSupabaseRow = {
  id: string;
  obra_id: string;
  user_id: string;
  titulo: string | null;
  texto: string | null;
  ordem: number | null;
  publicado: boolean | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

export async function carregarCapitulosSupabaseEdicaoObra(
  obraId: string,
  userId: string,
): Promise<CapituloSupabaseRow[]> {
  try {
    return await carregarTodasPaginasSupabase<CapituloSupabaseRow>({
      nomeColecao: "capítulos da edição de obra",
      buscarPagina: async (inicio, fim) =>
        supabase
          .from("capitulos")
          .select(
            "id,obra_id,user_id,titulo,texto,ordem,publicado,criado_em,atualizado_em",
          )
          .eq("obra_id", obraId)
          .eq("user_id", userId)
          .order("ordem", { ascending: true })
          .order("id", { ascending: true })
          .range(inicio, fim),
    });
  } catch (error) {
    console.warn("Não consegui carregar capítulos da obra no Supabase:", error);
    return [];
  }
}
