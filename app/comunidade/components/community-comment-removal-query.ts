import { supabase } from "../../../lib/supabase/client";
import type { SupabaseComentarioRow } from "./community-supabase-comment-row";

export type ComentarioBancoParaRemocaoComunidade = Pick<
  SupabaseComentarioRow,
  "id" | "post_id" | "autor_id"
>;

export type ResultadoConsultaComentarioParaRemocaoComunidade =
  | { sucesso: false; erro: unknown }
  | {
      sucesso: true;
      comentarioBanco: ComentarioBancoParaRemocaoComunidade | null;
    };

export async function consultarComentarioParaRemocaoComunidade(
  comentarioId: string
): Promise<ResultadoConsultaComentarioParaRemocaoComunidade> {
  const { data, error } = await supabase
    .from("comunidade_comentarios")
    .select("id, post_id, autor_id")
    .eq("id", comentarioId)
    .maybeSingle();

  if (error) {
    return { sucesso: false, erro: error };
  }

  return { sucesso: true, comentarioBanco: data };
}
