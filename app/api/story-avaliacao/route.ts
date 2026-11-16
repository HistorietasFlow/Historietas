import { carregarStoryAvaliacaoObra } from "../../../lib/server/stories/carregar-story-avaliacao";
import { gerarStoryAvaliacao } from "../../../lib/server/stories/gerar-story-avaliacao";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie", "X-Content-Type-Options": "nosniff" };

export async function POST(request: Request) {
  const json = (body: object, status: number) => Response.json(body, { status, headers });
  // Next pode normalizar request.url para localhost atrás do servidor HTTP.
  // Host é o destino efetivo do pedido; não aceitar X-Forwarded-Host arbitrário.
  const requestUrl = new URL(request.url);
  const origin = `${requestUrl.protocol}//${request.headers.get("host") || requestUrl.host}`;
  if (request.headers.get("origin") !== origin ||
    request.headers.get("sec-fetch-site") === "cross-site") return json({ disponivel: false }, 403);
  try {
    if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ disponivel: false }, 400);
    const body = await request.text();
    if (body.length > 1024) return json({ disponivel: false }, 400);
    const { slug, leitorId, acao } = JSON.parse(body);
    if (typeof slug !== "string" || typeof leitorId !== "string" || !["confirmar", "gerar"].includes(acao)) return json({ disponivel: false }, 400);
    // O loader valida o ID solicitado contra auth.getUser(), nunca contra o body sozinho.
    if (acao === "confirmar") {
      const result = await carregarStoryAvaliacaoObra({ slug, leitorId });
      return result.estado === "disponivel"
        ? json({ disponivel: true, nota: result.payload.avaliacao.nota }, 200)
        : json({ disponivel: false }, 403);
    }
    const result = await gerarStoryAvaliacao({ slug, leitorId });
    if (result.estado !== "gerado") return json({ disponivel: false }, 403);
    return new Response(new Uint8Array(result.png), { headers: { ...headers,
      "Content-Type": "image/png", "Content-Disposition": 'attachment; filename="historietas-avaliacao.png"' } });
  } catch {
    return json({ disponivel: false }, 503);
  }
}
