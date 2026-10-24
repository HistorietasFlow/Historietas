import { supabase } from "../../../lib/supabase/client";
import { carregarTodasPaginasPorLotesSupabase } from "../../../lib/supabase/paginacao.mjs";

type CapituloPainelAutorSupabaseRow = {
  id: string;
  obra_id: string;
  user_id?: string | null;
  titulo: string | null;
  texto: string | null;
  ordem: number | null;
  publicado: boolean | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

export async function carregarCapitulosPainelAutorSupabase(
  userId: string,
  obraIds: string[]
) {
  let capitulosSupabaseBanco: CapituloPainelAutorSupabaseRow[] = [];

  try {
    capitulosSupabaseBanco =
      await carregarTodasPaginasPorLotesSupabase<CapituloPainelAutorSupabaseRow, string>({
        nomeColecao: "capítulos do Painel do Autor",
        itens: obraIds,
        buscarPaginaLote: async (obraIdsLote, inicio, fim) =>
          supabase
            .from("capitulos")
            .select("id,obra_id,user_id,titulo,texto,ordem,publicado,criado_em,atualizado_em")
            .in("obra_id", obraIdsLote)
            .eq("user_id", userId)
            .order("obra_id", { ascending: true })
            .order("ordem", { ascending: true })
            .order("id", { ascending: true })
            .range(inicio, fim),
      });
  } catch (error) {
    console.warn(
      "Não consegui carregar capítulos no Painel do Autor:",
      error,
    );
  }

  return capitulosSupabaseBanco;
}
