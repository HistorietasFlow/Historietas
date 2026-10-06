import { supabase } from "../../../../lib/supabase/client";
import { carregarTodasPaginasPorLotesSupabase } from "../../../../lib/supabase/paginacao.mjs";
import type { SupabaseComentarioObraRow } from "./obra-comment-utils";

export async function carregarRespostasComentariosObraSupabase(
  obraId: string,
  comentariosPais: string[],
) {
  return carregarTodasPaginasPorLotesSupabase<
    SupabaseComentarioObraRow,
    string
  >({
    nomeColecao: "respostas dos comentários da obra",
    itens: comentariosPais,
    buscarPaginaLote: async (comentariosPaisLote, paginaInicio, paginaFim) =>
      supabase
        .from("comentarios_obras")
        .select(
          "id,obra_id,user_id,comentario,comentario_pai_id,criado_em",
        )
        .eq("obra_id", obraId)
        .in("comentario_pai_id", comentariosPaisLote)
        .order("criado_em", { ascending: true })
        .order("id", { ascending: true })
        .range(paginaInicio, paginaFim),
  });
}
