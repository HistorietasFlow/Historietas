import { supabase } from "../../../lib/supabase/client";
import type { SupabasePostRow } from "./community-supabase-post-row";

type PostRemovidoBancoComunidade = Pick<
  SupabasePostRow,
  "id" | "autor_id" | "tipo_publicacao"
>;

type ResultadoRemocaoPostSupabaseComunidade =
  | { sucesso: false; erro: unknown }
  | {
      sucesso: true;
      postsRemovidos: PostRemovidoBancoComunidade[] | null;
    };

export async function removerPostSupabaseComunidade(
  postId: string,
  usuarioAutenticadoId: string,
  usuarioAtualEhAdmin: boolean
): Promise<ResultadoRemocaoPostSupabaseComunidade> {
  let removerPostQuery = supabase
    .from("comunidade_posts")
    .delete()
    .eq("id", postId);

  if (!usuarioAtualEhAdmin) {
    removerPostQuery = removerPostQuery.eq(
      "autor_id",
      usuarioAutenticadoId
    );
  }

  const { data, error } = await removerPostQuery.select(
    "id, autor_id, tipo_publicacao"
  );

  if (error) {
    return { sucesso: false, erro: error };
  }

  return { sucesso: true, postsRemovidos: data };
}
