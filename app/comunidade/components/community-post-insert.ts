import { supabase } from "../../../lib/supabase/client";
import type { TablesInsert } from "../../../lib/supabase/database.types";
import type { SupabasePostRow } from "./community-supabase-post-row";

type DadosInsercaoPostComunidade = Pick<
  SupabasePostRow,
  | "autor_id"
  | "autor_nome"
  | "categoria"
  | "tipo_publicacao"
  | "tem_spoiler"
  | "texto"
  | "obra_relacionada"
  | "visibilidade"
>;

type ResultadoInsercaoPostSupabaseComunidade =
  | { sucesso: false; erro: unknown }
  | { sucesso: true };

export async function inserirPostSupabaseComunidade(
  dadosPostBanco: DadosInsercaoPostComunidade &
    TablesInsert<"comunidade_posts">
): Promise<ResultadoInsercaoPostSupabaseComunidade> {
  const { error } = await supabase
    .from("comunidade_posts")
    .insert(dadosPostBanco);

  if (error) {
    return { sucesso: false, erro: error };
  }

  return { sucesso: true };
}
