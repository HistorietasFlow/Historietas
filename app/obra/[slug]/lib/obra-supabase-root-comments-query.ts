import { supabase } from "../../../../lib/supabase/client";

export async function consultarPaginaRaizesComentariosObraSupabase(
  obraId: string,
  inicio: number,
  fim: number,
) {
  return supabase
    .from("comentarios_obras")
    .select("id,obra_id,user_id,comentario,comentario_pai_id,criado_em")
    .eq("obra_id", obraId)
    .is("comentario_pai_id", null)
    .order("criado_em", { ascending: false })
    .order("id", { ascending: false })
    .range(inicio, fim);
}
