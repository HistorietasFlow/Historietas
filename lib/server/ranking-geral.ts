import "server-only";
import { criarSupabasePublicClient } from "../supabase/public";
import { paginaRankingValida, type RankingCursor, type RankingPage } from "../ranking-geral-contract";

type RpcRow = {
  estado: string; obra_id: string; posicao: number; nota_media: number;
  total_avaliacoes: number; assinatura: string; tem_mais: boolean;
};
// Contrato aditivo da #2348, ainda não presente no schema da main.
type RankingRpc = {
  rpc(name: "listar_ranking_geral", args: {
    p_apos_obra: string | null; p_assinatura: string | null; p_limite: number;
  }): PromiseLike<{ data: RpcRow[] | null; error: unknown }>;
};

export async function carregarRankingGeral(cursor: RankingCursor | null): Promise<RankingPage> {
  // Cliente novo e anônimo: nunca encaminhar cookies ou Authorization da requisição.
  const client = criarSupabasePublicClient({
    fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
  });
  const { data, error } = await (client as unknown as RankingRpc).rpc("listar_ranking_geral", {
    p_apos_obra: cursor?.obra ?? null, p_assinatura: cursor?.assinatura ?? null, p_limite: 20,
  });
  if (error || !Array.isArray(data)) throw new Error("ranking_indisponivel");
  if (data.length === 1 && data[0].estado === "cursor_desatualizado") {
    return { estado: "cursor_desatualizado" };
  }
  if (!data.length) return { estado: "ok", itens: [], proximo: null };
  if (data.length > 20 || data.some(row => row.estado !== "ok"
    || row.assinatura !== data[0].assinatura || typeof row.tem_mais !== "boolean")) {
    throw new Error("ranking_indisponivel");
  }
  const { data: obras, error: obraError } = await client.from("obras")
    .select("id,slug,titulo").in("id", data.map(row => row.obra_id))
    .eq("publicado", true).in("classificacao_indicativa", ["Livre", "10+", "12+", "14+", "16+"]);
  if (obraError || !obras) throw new Error("ranking_indisponivel");
  const porId = new Map(obras.map(obra => [obra.id, obra]));
  // Revogação entre a RPC e a leitura pública: descartar a página inteira.
  if (data.some(row => !porId.has(row.obra_id))) return { estado: "cursor_desatualizado" };
  const last = data[data.length - 1];
  const page: RankingPage = {
    estado: "ok",
    itens: data.map(row => ({
      id: row.obra_id, slug: porId.get(row.obra_id)!.slug ?? "",
      titulo: porId.get(row.obra_id)!.titulo ?? "", posicao: row.posicao,
      nota: row.nota_media, avaliacoes: row.total_avaliacoes,
    })),
    proximo: last.tem_mais ? { obra: last.obra_id, assinatura: last.assinatura } : null,
  };
  if (!paginaRankingValida(page)) throw new Error("ranking_indisponivel");
  return page;
}
