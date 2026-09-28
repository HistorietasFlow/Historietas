import { supabase } from "../../../lib/supabase/client";
import type { SupabaseComentarioRow } from "./community-supabase-comment-row";

export type ComentarioRemovidoBancoComunidade = Pick<
  SupabaseComentarioRow,
  "id"
>;

export type ResultadoRemocaoComentarioSupabaseComunidade =
  | { sucesso: false; erro: unknown }
  | {
      sucesso: true;
      comentariosRemovidos: ComentarioRemovidoBancoComunidade[] | null;
    };

export async function removerComentarioSupabaseComunidade(
  comentarioId: string,
  usuarioAutenticadoId: string
): Promise<ResultadoRemocaoComentarioSupabaseComunidade> {
  const { data, error } = await supabase
    .from("comunidade_comentarios")
    .delete()
    .eq("id", comentarioId)
    .eq("autor_id", usuarioAutenticadoId)
    .select("id");

  if (error) {
    return { sucesso: false, erro: error };
  }

  return { sucesso: true, comentariosRemovidos: data };
}
