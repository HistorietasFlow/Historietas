import { supabase } from "../../../../lib/supabase/client";
import { carregarTodasPaginasPorLotesSupabase } from "../../../../lib/supabase/paginacao.mjs";
import { WORK_COMMENT_LIKES_TABLE } from "./obra-supabase-comment-like-persistence";

export async function carregarCurtidasComentariosObraSupabase(
  comentariosIds: string[]
) {
  return carregarTodasPaginasPorLotesSupabase<
    { comentario_id: string; usuario_id: string },
    string
  >({
    nomeColecao: "curtidas dos comentários da obra",
    itens: comentariosIds,
    buscarPaginaLote: async (comentarioIdsLote, inicio, fim) =>
      supabase
        .from(WORK_COMMENT_LIKES_TABLE)
        .select("comentario_id,usuario_id")
        .in("comentario_id", comentarioIdsLote)
        .order("comentario_id", { ascending: true })
        .order("usuario_id", { ascending: true })
        .range(inicio, fim),
  });
}
