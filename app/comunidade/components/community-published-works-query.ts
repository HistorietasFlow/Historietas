import { supabase } from "../../../lib/supabase/client";
import type { SupabaseObraPublicaRow } from "./community-related-work-supabase-normalizer";

type ResultadoConsultaObrasPublicadasComunidade =
  | { sucesso: false; erro: unknown }
  | {
      sucesso: true;
      obrasEncontradas: SupabaseObraPublicaRow[] | null;
    };

export async function consultarObrasPublicadasComunidade(): Promise<
  ResultadoConsultaObrasPublicadasComunidade
> {
  const { data, error } = await supabase
    .from("obras")
    .select(
      "id, user_id, titulo, autor, classificacao_indicativa, publicado, slug, link"
    )
    .eq("publicado", true)
    .order("criada_em", { ascending: false })
    .limit(120);

  if (error) {
    return { sucesso: false, erro: error };
  }

  return { sucesso: true, obrasEncontradas: data };
}
