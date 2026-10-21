import { supabase } from "../../../lib/supabase/client";
import { idUsuarioSupabaseValido } from "./configuracoes-account-utils";
import { criarResumoLocal } from "./configuracoes-local-summary-utils";
import type {
  ResumoLocal,
  ResultadoContagemResumoSupabase,
  TabelaResumoSupabase,
} from "./configuracoes-account-models";

async function contarRegistrosResumoSupabase({
  tabela,
  userId,
}: {
  tabela: TabelaResumoSupabase;
  userId: string;
}): Promise<ResultadoContagemResumoSupabase> {
  try {
    const consultas = {
      obras: () =>
        supabase
          .from("obras")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
      favoritos: () =>
        supabase
          .from("favoritos")
          .select("obra_id", { count: "exact", head: true })
          .eq("user_id", userId),
      concluidas: () =>
        supabase
          .from("concluidas")
          .select("obra_id", { count: "exact", head: true })
          .eq("user_id", userId),
      seguindo_obras: () =>
        supabase
          .from("seguindo_obras")
          .select("obra_id", { count: "exact", head: true })
          .eq("user_id", userId),
      seguindo_usuarios: () =>
        supabase
          .from("seguindo_usuarios")
          .select("id", { count: "exact", head: true })
          .eq("seguidor_id", userId),
    } satisfies Record<TabelaResumoSupabase, () => PromiseLike<unknown>>;

    const { count, error } = await consultas[tabela]();

    if (error) {
      console.warn(
        `Não consegui contar ${tabela} no resumo da conta:`,
        error.message,
      );
      return { ok: false, total: 0 };
    }

    return {
      ok: true,
      total:
        typeof count === "number" && Number.isFinite(count)
          ? Math.max(0, Math.trunc(count))
          : 0,
    };
  } catch (error) {
    console.warn(`Não consegui acessar ${tabela} no resumo da conta:`, error);
    return { ok: false, total: 0 };
  }
}

export async function carregarResumoContaSupabase(
  userId: string,
): Promise<ResumoLocal> {
  const userIdLimpo = userId.trim();
  const fallbackLocal = criarResumoLocal(userIdLimpo);

  if (!idUsuarioSupabaseValido(userIdLimpo)) {
    return fallbackLocal;
  }

  const [
    obras,
    favoritas,
    concluidas,
    seguindoObras,
    seguindoAutores,
  ] = await Promise.all([
    contarRegistrosResumoSupabase({
      tabela: "obras",
      userId: userIdLimpo,
    }),
    contarRegistrosResumoSupabase({
      tabela: "favoritos",
      userId: userIdLimpo,
    }),
    contarRegistrosResumoSupabase({
      tabela: "concluidas",
      userId: userIdLimpo,
    }),
    contarRegistrosResumoSupabase({
      tabela: "seguindo_obras",
      userId: userIdLimpo,
    }),
    contarRegistrosResumoSupabase({
      tabela: "seguindo_usuarios",
      userId: userIdLimpo,
    }),
  ]);

  return {
    ...fallbackLocal,
    obras: obras.ok ? obras.total : fallbackLocal.obras,
    favoritas: favoritas.ok ? favoritas.total : fallbackLocal.favoritas,
    concluidas: concluidas.ok ? concluidas.total : fallbackLocal.concluidas,
    seguindoObras: seguindoObras.ok
      ? seguindoObras.total
      : fallbackLocal.seguindoObras,
    seguindoAutores: seguindoAutores.ok
      ? seguindoAutores.total
      : fallbackLocal.seguindoAutores,
  };
}
