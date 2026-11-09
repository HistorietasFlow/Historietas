import { obterLeituraCapituloPublico } from "../../../lib/cache/obrasPublicas";
import { lerRotaPublicaLeitor } from "../../ler-capitulo/lib/ler-capitulo-public-snapshot";

export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
};

// O contrato existente inclui a lista de capítulos/textos. Não transformar uma
// atualização grande em resposta bufferizada sujeita ao limite de payload da Function.
function snapshotJson(valor: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(valor));
  let inicio = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (inicio >= bytes.length) { controller.close(); return; }
      controller.enqueue(bytes.subarray(inicio, inicio + 65536));
      inicio += 65536;
    },
  });
  return new Response(body, { headers: { ...headers, "Content-Type": "application/json; charset=utf-8" } });
}

// Leitura pública: não interpreta cookies/sessão, não usa service role nem escritas. O loader é
// server-only e confirma a revisão no primário por POST/no-store antes/depois.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const rota = lerRotaPublicaLeitor(`/obra/${encodeURIComponent(params.get("slug") || "")}/capitulo/${params.get("numero") || ""}`);
  if (!rota) return Response.json({ erro: "Parâmetros inválidos." }, { status: 400, headers });
  try {
    const leitura = await obterLeituraCapituloPublico(rota.slug, rota.numero);
    if (!leitura) return Response.json({ estado: "ausente" }, { headers });
    const identidade = { obraId: leitura.obraId, geracao: leitura.geracao, revisao: leitura.revisao,
      capituloId: leitura.capituloId, numeroCapitulo: leitura.numeroCapitulo };
    const inalterada = params.get("obraId") === leitura.obraId &&
      params.get("geracao") === leitura.geracao && params.get("revisao") === leitura.revisao;
    if (inalterada) return Response.json({ estado: "inalterada", ...identidade }, { headers });
    return snapshotJson({ estado: "disponivel", ...identidade, obra: leitura.obra });
  } catch (erro) {
    console.error("Falha na confirmação pública do leitor", erro instanceof Error ? erro.name : "erro remoto");
    return Response.json({ erro: "Não foi possível confirmar o capítulo. Tente novamente." }, { status: 503, headers });
  }
}
