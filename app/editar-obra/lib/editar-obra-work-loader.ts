import { supabase } from "../../../lib/supabase/client";

export type ObraSupabaseRow = {
  id: string;
  user_id: string;
  titulo: string | null;
  autor: string | null;
  genero: string | null;
  formato: string | null;
  classificacao_indicativa: string | null;
  avisos_conteudo: string[] | null;
  sinopse: string | null;
  tags: string[] | null;
  capa_url: string | null;
  capa_nome: string | null;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  arquivo_tipo: string | null;
  arquivo_tamanho: number | null;
  arquivo_categoria: string | null;
  publicado: boolean | null;
  visualizacoes: number | null;
  slug: string | null;
  link: string | null;
  criada_em: string | null;
  atualizado_em: string | null;
};

export async function carregarObraSupabaseEdicaoObra(
  obraId: string,
  userId: string,
): Promise<ObraSupabaseRow | null> {
  const { data: obraSupabase, error: erroObraSupabase } = await supabase
    .from("obras")
    .select(
      "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,avisos_conteudo,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,visualizacoes,slug,link,criada_em,atualizado_em",
    )
    .eq("id", obraId)
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (erroObraSupabase) {
    console.warn("Não consegui carregar a obra no Supabase:", erroObraSupabase.message);
    return null;
  }

  return obraSupabase;
}
