import { supabase } from "../../../lib/supabase/client";
import type { SupabasePostRow } from "./community-supabase-post-row";

export async function consultarPostCriadoComunidade(
  usuarioAutenticadoId: string,
  textoPostBanco: string
): Promise<SupabasePostRow | null> {
  const { data } = await supabase
    .from("comunidade_posts")
    .select(
      "id, autor_id, autor_nome, categoria, tipo_publicacao, tem_spoiler, texto, obra_relacionada, criado_em, fixado, fixado_em, fixado_por, visibilidade"
    )
    .eq("autor_id", usuarioAutenticadoId)
    .eq("texto", textoPostBanco)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}
