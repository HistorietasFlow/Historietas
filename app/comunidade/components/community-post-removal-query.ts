import { supabase } from "../../../lib/supabase/client";
import type { SupabasePostRow } from "./community-supabase-post-row";

type PostBancoParaRemocaoComunidade = Pick<
  SupabasePostRow,
  "id" | "autor_id" | "tipo_publicacao"
>;

type ResultadoConsultaPostParaRemocaoComunidade =
  | { sucesso: false; erro: unknown }
  | {
      sucesso: true;
      postBanco: PostBancoParaRemocaoComunidade | null;
    };

export async function consultarPostParaRemocaoComunidade(
  postId: string
): Promise<ResultadoConsultaPostParaRemocaoComunidade> {
  const { data, error } = await supabase
    .from("comunidade_posts")
    .select("id, autor_id, tipo_publicacao")
    .eq("id", postId)
    .maybeSingle();

  if (error) {
    return { sucesso: false, erro: error };
  }

  return { sucesso: true, postBanco: data };
}
