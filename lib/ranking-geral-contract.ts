export type RankingCursor = { obra: string; assinatura: string };
export type RankingItem = {
  id: string; slug: string; titulo: string; posicao: number;
  nota: number; avaliacoes: number;
};
export type RankingPage =
  | { estado: "ok"; itens: RankingItem[]; proximo: RankingCursor | null }
  | { estado: "cursor_desatualizado" };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function cursorRankingValido(value: unknown): value is RankingCursor {
  if (!value || typeof value !== "object") return false;
  const cursor = value as RankingCursor;
  return typeof cursor.obra === "string" && uuid.test(cursor.obra)
    && typeof cursor.assinatura === "string" && /^[0-9a-f]{32}$/.test(cursor.assinatura);
}

export function lerCursorRanking(params: URLSearchParams): RankingCursor | null {
  if ([...params.keys()].some(key => !["obra", "assinatura"].includes(key))
    || params.getAll("obra").length > 1 || params.getAll("assinatura").length > 1) {
    throw new Error("cursor_invalido");
  }
  if (!params.has("obra") && !params.has("assinatura")) return null;
  const cursor = { obra: params.get("obra"), assinatura: params.get("assinatura") };
  if (!cursorRankingValido(cursor)) throw new Error("cursor_invalido");
  return cursor;
}

export function paginaRankingValida(value: unknown): value is RankingPage {
  if (!value || typeof value !== "object") return false;
  const page = value as RankingPage;
  if (page.estado === "cursor_desatualizado") return true;
  if (page.estado !== "ok" || !Array.isArray(page.itens) || page.itens.length > 20
    || (page.proximo !== null && !cursorRankingValido(page.proximo))) return false;
  return page.itens.every((item, index) => item && typeof item.id === "string" && uuid.test(item.id)
      && typeof item.slug === "string" && item.slug.trim().length > 0
      && typeof item.titulo === "string" && item.titulo.trim().length > 0
      && Number.isSafeInteger(item.posicao) && item.posicao > 0
      && (index === 0 || item.posicao > page.itens[index - 1].posicao)
      && Number.isFinite(item.nota) && item.nota >= 0 && item.nota <= 5
      && Number.isSafeInteger(item.avaliacoes) && item.avaliacoes >= 1)
    && new Set(page.itens.map(item => item.id)).size === page.itens.length
    && (page.proximo === null || page.proximo.obra === page.itens.at(-1)?.id);
}
