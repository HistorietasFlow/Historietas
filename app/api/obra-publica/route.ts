import { obterSnapshotObraPublica } from "../../../lib/cache/obrasPublicas";
import { slugRotaObra } from "../../obra/[slug]/lib/obra-public-snapshot";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store, max-age=0", "CDN-Cache-Control": "no-store", "Vercel-CDN-Cache-Control": "no-store" };

// Somente leitura pública. Cookies da mesma origem servem à Deployment Protection;
// não são interpretados nem encaminhados ao cliente anônimo do Supabase.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const slug = slugRotaObra(`/obra/${encodeURIComponent(params.get("slug") || "")}`);
  if (!slug) return Response.json({ erro: "Parâmetros inválidos." }, { status: 400, headers });
  try {
    const snapshot = await obterSnapshotObraPublica(slug);
    if (!snapshot) return Response.json({ estado: "ausente" }, { headers });
    if (["obraId", "geracao", "revisao"].every(key => params.get(key) === snapshot[key as "obraId" | "geracao" | "revisao"])) {
      return Response.json({ estado: "inalterada", obraId: snapshot.obraId, geracao: snapshot.geracao,
        revisao: snapshot.revisao, slug: snapshot.slug }, { headers });
    }
    return Response.json({ estado: "disponivel", snapshot }, { headers });
  } catch {
    return Response.json({ erro: "Não foi possível confirmar a obra. Tente novamente." }, { status: 503, headers });
  }
}
