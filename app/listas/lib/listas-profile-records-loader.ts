import { supabase } from "../../../lib/supabase/client";
import {
  AVALIACAO_DIARIO_LISTAS_VAZIA,
  normalizarAvaliacaoDiarioListas,
  type AvaliacaoDiarioListasEstado,
} from "./listas-diary-rating-utils";
import { criarPerfilLista } from "./listas-profile-state-utils";
import { idUsuarioValido } from "./listas-value-utils";

type RegistroGenerico = Record<string, unknown>;

export type TabelaRegistrosUsuarioListas =
  | "seguindo_obras"
  | "favoritos"
  | "concluidas"
  | "obra_avaliacoes"
  | "progresso_leitura"
  | "diario_anotacoes";

export async function carregarAvaliacaoDiarioListas(
  perfilUserId: string,
): Promise<AvaliacaoDiarioListasEstado> {
  const userId = perfilUserId.trim();

  if (!idUsuarioValido(userId)) {
    return { ...AVALIACAO_DIARIO_LISTAS_VAZIA };
  }

  const { data, error } = await supabase.rpc("carregar_avaliacao_diario", {
    p_diario_user_id: userId,
  });

  if (error) {
    throw error;
  }

  return normalizarAvaliacaoDiarioListas(data);
}

export async function carregarPerfil(userId: string, nomeFallback = "") {
  if (!idUsuarioValido(userId)) {
    return criarPerfilLista(null, userId, nomeFallback);
  }

  for (const campo of ["user_id", "id"] as const) {
    try {
      const { data, error } = await supabase
        .from("profiles_publicos")
        .select("id,user_id,nome,username,avatar_url,bio,sobre_bio")
        .eq(campo, userId)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return criarPerfilLista(data, userId, nomeFallback);
      }
    } catch {
      // Tenta buscar pelo identificador alternativo.
    }
  }

  return criarPerfilLista(null, userId, nomeFallback);
}

export async function carregarRegistrosUsuario(
  tabela: TabelaRegistrosUsuarioListas,
  userId: string,
) {
  if (!idUsuarioValido(userId)) {
    return [];
  }

  try {
    const consultas = {
      seguindo_obras: () =>
        supabase
          .from("seguindo_obras")
          .select("obra_id,visibilidade,criado_em")
          .eq("user_id", userId)
          .limit(2000),
      favoritos: () =>
        supabase
          .from("favoritos")
          .select("obra_id,visibilidade,criado_em")
          .eq("user_id", userId)
          .limit(2000),
      concluidas: () =>
        supabase
          .from("concluidas")
          .select("obra_id,visibilidade,criado_em")
          .eq("user_id", userId)
          .limit(2000),
      obra_avaliacoes: () =>
        supabase
          .from("obra_avaliacoes")
          .select("obra_id,nota,criado_em,atualizado_em")
          .eq("user_id", userId)
          .limit(2000),
      progresso_leitura: () =>
        supabase
          .from("progresso_leitura")
          .select(
            "obra_id,capitulo_id,lido,progresso,criado_em,atualizado_em",
          )
          .eq("user_id", userId)
          .limit(2000),
      diario_anotacoes: () =>
        supabase
          .from("diario_anotacoes")
          .select(
            "id,obra_id,tipo,texto,visibilidade,quem_pode_comentar,visibilidade_comentarios,permitir_curtidas,contem_spoiler,criado_em,atualizado_em",
          )
          .eq("user_id", userId)
          .limit(2000),
    } satisfies Record<
      TabelaRegistrosUsuarioListas,
      () => PromiseLike<unknown>
    >;

    const { data, error } = await consultas[tabela]();

    if (error) {
      console.warn(`Nao consegui carregar ${tabela} na pagina Listas:`, error.message);
      return [];
    }

    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .filter(
        (registro) =>
          Boolean(
            registro &&
              typeof registro === "object" &&
              !Array.isArray(registro),
          ),
      )
      .map((registro) => registro as unknown as RegistroGenerico);
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha desconhecida";
    console.warn(`Nao consegui carregar ${tabela} na pagina Listas:`, mensagem);
    return [];
  }
}
