import { supabase } from "../../../lib/supabase/client";
import {
  carregarTodasPaginasPorLotesSupabase,
  carregarTodasPaginasSupabase,
} from "../../../lib/supabase/paginacao.mjs";
import {
  normalizarRegistrosSupabaseGenericos,
} from "./seguindo-record-utils";
import type { RegistroSupabaseGenerico } from "./seguindo-record-utils";

export async function carregarUsuarioAtualSeguindoSupabase() {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id || "";
  } catch {
    return "";
  }
}

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

export type SupabaseObraSeguindoRow = {
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
  publicado: boolean | null;
  slug: string | null;
  link: string | null;
  criada_em: string | null;
  atualizado_em: string | null;
};

export type SupabaseCapituloSeguindoRow = {
  id: string;
  obra_id: string;
  user_id?: string | null;
  titulo: string | null;
  texto?: string | null;
  ordem: number | null;
  publicado: boolean | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

export async function carregarObrasPublicadasSeguindoSupabase() {
  return carregarTodasPaginasSupabase<SupabaseObraSeguindoRow>({
    nomeColecao: "obras publicadas do Seguindo",
    buscarPagina: async (inicio, fim) =>
      supabase
        .from("obras")
        .select(
          "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,publicado,slug,link,criada_em,atualizado_em",
        )
        .eq("publicado", true)
        .order("criada_em", { ascending: false })
        .order("id", { ascending: false })
        .range(inicio, fim),
  });
}

export async function carregarCapitulosPublicadosSeguindoSupabase(
  obraIds: string[],
) {
  if (obraIds.length === 0) {
    return [] as SupabaseCapituloSeguindoRow[];
  }

  try {
    return await carregarTodasPaginasPorLotesSupabase<
      SupabaseCapituloSeguindoRow,
      string
    >({
      nomeColecao: "capítulos publicados do Seguindo",
      itens: obraIds,
      buscarPaginaLote: async (obraIdsLote, inicio, fim) =>
        supabase
          .from("capitulos")
          .select(
            "id,obra_id,user_id,titulo,ordem,publicado,criado_em,atualizado_em",
          )
          .in("obra_id", obraIdsLote)
          .eq("publicado", true)
          .order("obra_id", { ascending: true })
          .order("ordem", { ascending: true })
          .order("id", { ascending: true })
          .range(inicio, fim),
    });
  } catch (error) {
    console.warn("Não consegui carregar capítulos no Seguindo:", error);
    return [] as SupabaseCapituloSeguindoRow[];
  }
}
