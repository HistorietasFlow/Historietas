import { supabase } from "../../../../lib/supabase/client";
import { normalizarObraSupabaseTop5 } from "./top5-work-normalizers";
import type {
  ObraTop5,
  SupabaseObraTop5Row,
} from "./top5-types";

export async function carregarObrasSupabaseTop5() {
  try {
    const { data, error } = await supabase
      .from("obras")
      .select(
        "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,publicado,visualizacoes,slug,criada_em,atualizado_em",
      )
      .eq("publicado", true)
      .order("criada_em", { ascending: false })
      .limit(160);

    if (error || !Array.isArray(data)) {
      return [] as ObraTop5[];
    }

    return data.map((obra, index) =>
      normalizarObraSupabaseTop5(obra as SupabaseObraTop5Row, index),
    );
  } catch {
    return [] as ObraTop5[];
  }
}
