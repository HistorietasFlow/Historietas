import { supabase } from "../../../lib/supabase/client";
import type { SupabaseComentarioRow } from "./community-supabase-comment-row";

type DadosInsercaoComentarioComunidade = Pick<
  SupabaseComentarioRow,
  | "post_id"
  | "autor_id"
  | "autor_nome"
  | "texto"
  | "comentario_pai_id"
>;

type ResultadoInsercaoComentarioSupabaseComunidade =
  | { sucesso: false; erro: unknown }
  | { sucesso: true; data: SupabaseComentarioRow | null };

export async function inserirComentarioSupabaseComunidade(
  dadosComentarioBanco: DadosInsercaoComentarioComunidade
): Promise<ResultadoInsercaoComentarioSupabaseComunidade> {
  const { data, error } = await supabase
    .from("comunidade_comentarios")
    .insert(dadosComentarioBanco)
    .select(
      "id, post_id, autor_id, autor_nome, texto, comentario_pai_id, criado_em"
    )
    .single();

  if (error) {
    return { sucesso: false, erro: error };
  }

  return { sucesso: true, data };
}
