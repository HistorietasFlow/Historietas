import { supabase } from "../../../lib/supabase/client";
import type { SupabasePostRow } from "./community-supabase-post-row";
import type { VisibilidadePostComunidade } from "./community-post-visibility";

export type PostVisibilidadeAtualizadaBancoComunidade = Pick<
  SupabasePostRow,
  "id" | "visibilidade"
>;

export type ResultadoAtualizacaoVisibilidadePostSupabaseComunidade =
  | { sucesso: false; erro: unknown }
  | {
      sucesso: true;
      data: PostVisibilidadeAtualizadaBancoComunidade | null;
    };

export async function atualizarVisibilidadePostSupabaseComunidade(
  postId: string,
  usuarioId: string,
  visibilidadeSegura: VisibilidadePostComunidade
): Promise<ResultadoAtualizacaoVisibilidadePostSupabaseComunidade> {
  const { data, error } = await supabase
    .from("comunidade_posts")
    .update({ visibilidade: visibilidadeSegura })
    .eq("id", postId)
    .eq("autor_id", usuarioId)
    .select("id, visibilidade")
    .maybeSingle();

  if (error) {
    return { sucesso: false, erro: error };
  }

  return { sucesso: true, data };
}
