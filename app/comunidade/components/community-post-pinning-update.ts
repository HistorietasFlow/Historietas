import { supabase } from "../../../lib/supabase/client";
import type { SupabasePostRow } from "./community-supabase-post-row";

type PostFixacaoAtualizadaBancoComunidade = Pick<
  SupabasePostRow,
  "fixado" | "fixado_em" | "fixado_por"
>;

type ResultadoAtualizacaoFixacaoPostSupabaseComunidade =
  | { sucesso: false; erro: unknown }
  | {
      sucesso: true;
      data: PostFixacaoAtualizadaBancoComunidade | null;
    };

export async function atualizarFixacaoPostSupabaseComunidade(
  postId: string,
  novoEstadoFixado: boolean
): Promise<ResultadoAtualizacaoFixacaoPostSupabaseComunidade> {
  const { data, error } = await supabase
    .from("comunidade_posts")
    .update({ fixado: novoEstadoFixado })
    .eq("id", postId)
    .select("fixado, fixado_em, fixado_por")
    .single();

  if (error) {
    return { sucesso: false, erro: error };
  }

  return { sucesso: true, data };
}
