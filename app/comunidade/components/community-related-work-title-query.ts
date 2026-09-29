import { supabase } from "../../../lib/supabase/client";
import type { SupabaseObraPublicaRow } from "./community-related-work-supabase-normalizer";

type ResultadoConsultaObrasPorTituloComunidade =
  | { sucesso: false; erro: unknown }
  | {
      sucesso: true;
      obrasEncontradas: SupabaseObraPublicaRow[] | null;
    };

export async function consultarObrasPorTituloComunidade(
  titulo: string
): Promise<ResultadoConsultaObrasPorTituloComunidade> {
  const { data, error } = await supabase
    .from("obras")
    .select(
      "id, user_id, titulo, autor, classificacao_indicativa, publicado, slug, link"
    )
    .eq("publicado", true)
    .eq("titulo", titulo)
    .limit(5);

  if (error) {
    return { sucesso: false, erro: error };
  }

  return { sucesso: true, obrasEncontradas: data };
}
