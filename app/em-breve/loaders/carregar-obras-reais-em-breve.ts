import { supabase } from "../../../lib/supabase/client";
import { ehClassificacao18 } from "../../../lib/historietasAdultContent";
import {
  carregarTodasPaginasPorLotesSupabase,
  carregarTodasPaginasSupabase,
} from "../../../lib/supabase/paginacao.mjs";
import {
  normalizarObraSupabaseEmBreve,
  obraSupabaseTemArquivoEmBreve,
  type ObraEmBreveCard,
  type SupabaseObraEmBreveRow,
} from "../lib/em-breve-work-normalizers";

export async function carregarObrasReaisEmBreve() {
  try {
    const obrasBanco =
      await carregarTodasPaginasSupabase<SupabaseObraEmBreveRow>({
        nomeColecao: "obras publicadas do Em breve",
        buscarPagina: async (inicio, fim) =>
          supabase
            .from("obras")
            .select(
              "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,capa_url,arquivo_url,publicado,slug,link,criada_em"
            )
            .eq("publicado", true)
            .order("criada_em", { ascending: false })
            .order("id", { ascending: false })
            .range(inicio, fim),
      });

    const obrasPublicadas = (
      obrasBanco
    ).filter((obra) => !ehClassificacao18(obra.classificacao_indicativa));
    const obraIds = obrasPublicadas
      .map((obra) => obra.id?.trim() || "")
      .filter(Boolean);

    if (obraIds.length === 0) {
      return [] as ObraEmBreveCard[];
    }

    const capitulosBanco =
      await carregarTodasPaginasPorLotesSupabase<{ obra_id: string }, string>({
        nomeColecao: "capítulos publicados das obras do Em breve",
        itens: obraIds,
        buscarPaginaLote: async (obraIdsLote, inicio, fim) =>
          supabase
            .from("capitulos")
            .select("id,obra_id")
            .in("obra_id", obraIdsLote)
            .eq("publicado", true)
            .order("obra_id", { ascending: true })
            .order("id", { ascending: true })
            .range(inicio, fim),
      });

    const obrasComCapituloPublicado = new Set(
      (capitulosBanco)
        .map((capitulo) => capitulo.obra_id?.trim() || "")
        .filter(Boolean)
    );

    return obrasPublicadas
      .filter((obra) => {
        const obraId = obra.id?.trim() || "";

        return (
          obraId &&
          !obrasComCapituloPublicado.has(obraId) &&
          !obraSupabaseTemArquivoEmBreve(obra)
        );
      })
      .map((obra) => normalizarObraSupabaseEmBreve(obra));
  } catch (error) {
    console.warn("Não consegui acessar obras reais do Em breve:", error);
    return [] as ObraEmBreveCard[];
  }
}
