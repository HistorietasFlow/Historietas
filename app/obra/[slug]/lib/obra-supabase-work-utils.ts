import { supabase } from "../../../../lib/supabase/client";

export async function consultarObraPublicaPorSlug(slug: string) {
  return supabase
    .from("obras")
    .select(
      "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,avisos_conteudo,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,visualizacoes,publicado,slug,link,criada_em,atualizado_em"
    )
    .eq("slug", slug)
    .eq("publicado", true)
    .limit(1);
}
