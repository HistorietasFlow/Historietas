import { supabase } from "../../../../lib/supabase/client";
import { carregarTodasPaginasSupabase } from "../../../../lib/supabase/paginacao.mjs";
import type { SupabaseCapituloRow } from "./obra-reading-utils";

export async function carregarCapitulosPublicadosObraSupabase(obraId: string) {
  return carregarTodasPaginasSupabase<SupabaseCapituloRow>({
    nomeColecao: "capítulos da obra pública",
    buscarPagina: async (inicio, fim) =>
      supabase
        .from("capitulos")
        .select("id,obra_id,user_id,titulo,ordem,publicado,criado_em,atualizado_em")
        .eq("obra_id", obraId)
        .eq("publicado", true)
        .order("ordem", { ascending: true })
        .order("id", { ascending: true })
        .range(inicio, fim),
  });
}
