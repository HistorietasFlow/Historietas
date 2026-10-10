import { supabase } from "../../../lib/supabase/client";
import { carregarTodasPaginasSupabase } from "../../../lib/supabase/paginacao.mjs";
import { CAMPOS_REGISTROS_DIARIO_PERFIL_AUTOR } from "../constants";
import type {
  TabelaObrasUsuario,
  TabelaRegistrosDiarioPerfil,
} from "../types";
import { pegarTexto } from "./data-normalizers";
import { normalizarNomeAutor } from "./profile-formatters";

export async function carregarIdsObrasTabelaUsuario(
  tabela: TabelaObrasUsuario,
  userId: string,
): Promise<string[]> {
  try {
    const data = await carregarTodasPaginasSupabase<{ obra_id: string }>({
      nomeColecao: `${tabela} do perfil do autor`,
      buscarPagina: async (inicio, fim) => {
        const consultas = {
          favoritos: () =>
            supabase
              .from("favoritos")
              .select("obra_id")
              .eq("user_id", userId)
              .order("obra_id", { ascending: true })
              .range(inicio, fim),
          concluidas: () =>
            supabase
              .from("concluidas")
              .select("obra_id")
              .eq("user_id", userId)
              .order("obra_id", { ascending: true })
              .range(inicio, fim),
          seguindo_obras: () =>
            supabase
              .from("seguindo_obras")
              .select("obra_id")
              .eq("user_id", userId)
              .order("obra_id", { ascending: true })
              .range(inicio, fim),
        };

        return consultas[tabela]();
      },
    });

    return Array.from(
      new Set(data.map(({ obra_id }) => obra_id.trim()).filter(Boolean)),
    );
  } catch {
    return [];
  }
}

export async function carregarAutoresSeguidosSupabase(
  userId: string,
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("seguindo_autores")
      .select("autor_nome")
      .eq("user_id", userId)
      .limit(1000);

    if (error || !Array.isArray(data)) {
      return [];
    }

    const autores: string[] = [];

    data.forEach((item: unknown) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return;
      }

      const registro = item as Record<string, unknown>;
      const autor = normalizarNomeAutor(pegarTexto(registro.autor_nome));

      if (autor) {
        autores.push(autor);
      }
    });

    return autores;
  } catch {
    return [];
  }
}

export async function carregarRegistrosDiarioPerfil(
  tabela: TabelaRegistrosDiarioPerfil,
  userId: string,
) {
  try {
    const consultas = {
      seguindo_obras: () =>
        supabase
          .from("seguindo_obras")
          .select(CAMPOS_REGISTROS_DIARIO_PERFIL_AUTOR.seguindo_obras)
          .eq("user_id", userId)
          .limit(1000),
      favoritos: () =>
        supabase
          .from("favoritos")
          .select(CAMPOS_REGISTROS_DIARIO_PERFIL_AUTOR.favoritos)
          .eq("user_id", userId)
          .limit(1000),
      concluidas: () =>
        supabase
          .from("concluidas")
          .select(CAMPOS_REGISTROS_DIARIO_PERFIL_AUTOR.concluidas)
          .eq("user_id", userId)
          .limit(1000),
      obra_avaliacoes: () =>
        supabase
          .from("obra_avaliacoes")
          .select(CAMPOS_REGISTROS_DIARIO_PERFIL_AUTOR.obra_avaliacoes)
          .eq("user_id", userId)
          .limit(1000),
      progresso_leitura: () =>
        supabase
          .from("progresso_leitura")
          .select(CAMPOS_REGISTROS_DIARIO_PERFIL_AUTOR.progresso_leitura)
          .eq("user_id", userId)
          .limit(1000),
      diario_atividades: () =>
        supabase
          .from("diario_atividades")
          .select(CAMPOS_REGISTROS_DIARIO_PERFIL_AUTOR.diario_atividades)
          .eq("user_id", userId)
          .limit(1000),
    } satisfies Record<
      TabelaRegistrosDiarioPerfil,
      () => PromiseLike<unknown>
    >;

    const { data, error } = await consultas[tabela]();

    if (error) {
      console.warn(
        `Não consegui carregar ${tabela} no Diário/Biblioteca do perfil:`,
        error.message,
      );

      return [] as Record<string, unknown>[];
    }

    if (!Array.isArray(data)) {
      return [] as Record<string, unknown>[];
    }

    const registros: Record<string, unknown>[] = [];

    data.forEach((registro: unknown) => {
      if (!registro || typeof registro !== "object" || Array.isArray(registro)) {
        return;
      }

      registros.push(registro as Record<string, unknown>);
    });

    return registros;
  } catch {
    return [] as Record<string, unknown>[];
  }
}
