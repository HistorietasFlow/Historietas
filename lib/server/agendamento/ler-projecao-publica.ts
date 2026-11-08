import "server-only";
import { criarSupabasePublicClient } from "../../supabase/public";
import type { Json } from "../../supabase/database.types";

type ObjetoJson = { [key: string]: Json | undefined };
export type ProjecaoPublicaObra = { estado: "obra_indisponivel" } | {
  estado: "obra_publica" | "capitulo_publico" | "capitulo_indisponivel";
  obraId: string;
  geracao: string;
  // bigint decimal: nao converter para number (inclusive acima de 2^53).
  revisao: string;
  slug: string;
  obra: ObjetoJson;
  capitulo: ObjetoJson | null;
};

function objeto(valor: Json | undefined): valor is ObjetoJson {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor);
}

/** Barreira primaria nova em cada invocacao; nao confirma flush nem ativa executor. */
export async function lerProjecaoPublicaObra(
  slug: string, numero: number | null = null,
): Promise<ProjecaoPublicaObra> {
  if (!slug || slug.length > 200 || (numero !== null && (!Number.isSafeInteger(numero) || numero < 1 || numero > 2147483647))) {
    throw new RangeError("Parametros da projecao publica invalidos.");
  }
  const supabase = criarSupabasePublicClient({
    // POST RPC + no-store: nao usa Data Cache nem memoizacao GET do render.
    // Cada chamada e uma leitura nova, inclusive duas barreiras no mesmo render.
    fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
  });
  const { data, error } = await supabase.rpc("obter_projecao_publica_obra", {
    p_slug: slug, p_numero: numero,
  });
  if (error) throw error;
  if (objeto(data)) {
    if (data.estado === "obra_indisponivel") return { estado: "obra_indisponivel" };
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (["obra_publica", "capitulo_publico", "capitulo_indisponivel"].includes(String(data.estado))
      && typeof data.obraId === "string" && uuid.test(data.obraId)
      && typeof data.geracao === "string" && uuid.test(data.geracao)
      && typeof data.revisao === "string" && /^[1-9][0-9]*$/.test(data.revisao)
      && data.slug === slug && objeto(data.obra)
      && (data.estado === "capitulo_publico" ? objeto(data.capitulo) : data.capitulo === null)
      && (numero === null ? data.estado === "obra_publica" : data.estado !== "obra_publica")) {
      return data as ProjecaoPublicaObra;
    }
  }
  throw new Error("Resposta da projecao publica invalida.");
}
