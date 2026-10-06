import { supabase } from "../../../../lib/supabase/client";

export function inserirComentarioObraSupabase(payload: {
  obra_id: string;
  user_id: string;
  comentario: string;
  comentario_pai_id: string | null;
}) {
  return supabase
    .from("comentarios_obras")
    .insert(payload)
    .select("id,obra_id,user_id,comentario,comentario_pai_id,criado_em")
    .single();
}
