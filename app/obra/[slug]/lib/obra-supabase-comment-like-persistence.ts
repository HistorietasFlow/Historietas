import { supabase } from "../../../../lib/supabase/client";

export const WORK_COMMENT_LIKES_TABLE = "comentarios_obras_curtidas";

export function removerCurtidaComentarioObraSupabase(
  comentarioId: string,
  userId: string,
) {
  return supabase
    .from(WORK_COMMENT_LIKES_TABLE)
    .delete()
    .eq("comentario_id", comentarioId)
    .eq("usuario_id", userId);
}

export function inserirCurtidaComentarioObraSupabase(
  comentarioId: string,
  userId: string,
) {
  return supabase.from(WORK_COMMENT_LIKES_TABLE).insert({
    comentario_id: comentarioId,
    usuario_id: userId,
  });
}
