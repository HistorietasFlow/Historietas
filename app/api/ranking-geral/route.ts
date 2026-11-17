import { carregarRankingGeral } from "../../../lib/server/ranking-geral";
import { lerCursorRanking } from "../../../lib/ranking-geral-contract";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  if (process.env.NEXT_PUBLIC_RANKING_GERAL_PREVIEW !== "true") {
    return Response.json({ estado: "desativado" }, { status: 404, headers });
  }
  let cursor;
  try { cursor = lerCursorRanking(new URL(request.url).searchParams); }
  catch { return Response.json({ estado: "cursor_invalido" }, { status: 400, headers }); }
  try {
    return Response.json(await carregarRankingGeral(cursor), { headers });
  } catch {
    // Nunca enviar erros SQL, credenciais, detalhes de schema ou requisições.
    return Response.json({ estado: "indisponivel" }, { status: 503, headers });
  }
}
