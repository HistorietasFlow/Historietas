import { supabase } from "../../../lib/supabase/client";
import { carregarTodasPaginasSupabase } from "../../../lib/supabase/paginacao.mjs";

type ObraPainelAutorSupabaseRow = {
  id: string;
  user_id?: string | null;
  titulo: string | null;
  autor: string | null;
  genero: string | null;
  formato: string | null;
  classificacao_indicativa: string | null;
  sinopse: string | null;
  tags: string[] | null;
  capa_url: string | null;
  capa_nome: string | null;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  arquivo_tipo: string | null;
  arquivo_tamanho: number | null;
  arquivo_categoria: string | null;
  visualizacoes: number | null;
  publicado: boolean | null;
  slug: string | null;
  link: string | null;
  criada_em: string | null;
  atualizado_em: string | null;
};

export async function carregarObrasPainelAutorSupabase(userId: string) {
  return carregarTodasPaginasSupabase<ObraPainelAutorSupabaseRow>({
    nomeColecao: "obras do Painel do Autor",
    buscarPagina: async (inicio, fim) =>
      supabase
        .from("obras")
        .select(
          "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,visualizacoes,publicado,slug,link,criada_em,atualizado_em"
        )
        .eq("user_id", userId)
        .order("criada_em", { ascending: false })
        .order("id", { ascending: false })
        .range(inicio, fim),
  });
}
