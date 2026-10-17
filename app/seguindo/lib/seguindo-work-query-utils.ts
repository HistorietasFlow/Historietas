import { supabase } from "../../../lib/supabase/client";
import {
  carregarTodasPaginasPorLotesSupabase,
  carregarTodasPaginasSupabase,
} from "../../../lib/supabase/paginacao.mjs";
import {
  normalizarRegistrosSupabaseGenericos,
} from "./seguindo-record-utils";
import type { RegistroSupabaseGenerico } from "./seguindo-record-utils";

export async function carregarIdsObrasUsuarioSupabase(
  tabela: "seguindo_obras" | "favoritos" | "concluidas",
  userId: string,
): Promise<RegistroSupabaseGenerico[]> {
  if (!userId) {
    return [];
  }

  try {
    const data = await carregarTodasPaginasSupabase<RegistroSupabaseGenerico>({
      nomeColecao: `${tabela} do Seguindo`,
      buscarPagina: async (inicio, fim) =>
        supabase
          .from(tabela)
          .select("obra_id")
          .eq("user_id", userId)
          .order("obra_id", { ascending: true })
          .range(inicio, fim),
    });

    return normalizarRegistrosSupabaseGenericos(data);
  } catch (error) {
    console.warn(`Não consegui acessar ${tabela} no Supabase:`, error);
    return [];
  }
}

export async function carregarComentariosCapitulosUsuarioSupabase(
  userId: string,
  capituloIds: string[],
): Promise<RegistroSupabaseGenerico[]> {
  if (!userId || capituloIds.length === 0) {
    return [];
  }

  for (const campos of [
    "id,capitulo_id,texto",
    "id,capitulo_id,comentario",
    "id,capitulo_id,conteudo",
  ]) {
    try {
      const data =
        await carregarTodasPaginasPorLotesSupabase<RegistroSupabaseGenerico, string>({
          nomeColecao: "comentários pessoais dos capítulos no Seguindo",
          itens: capituloIds,
          buscarPaginaLote: async (capituloIdsLote, inicio, fim) => {
            const resposta = await supabase
              .from("comentarios_capitulos")
              .select(campos)
              .eq("user_id", userId)
              .in("capitulo_id", capituloIdsLote)
              .order("capitulo_id", { ascending: true })
              .order("id", { ascending: true })
              .range(inicio, fim);

            return resposta as unknown as {
              data: RegistroSupabaseGenerico[] | null;
              error: unknown;
            };
          },
        });

      return normalizarRegistrosSupabaseGenericos(data);
    } catch {
      // O texto local do comentário continua como fallback.
    }
  }

  return [];
}
