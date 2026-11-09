import type { MetadataRoute } from "next";
import { criarRotasConteudoPublicoSitemap } from "../lib/sitemap-public-content-utils";
import { serializarSitemapPublico } from "../lib/sitemap-public-xml";
import { obterConteudoSitemapPublico } from "../../lib/cache/sitemap-projecao-publica";
import {
  ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO,
  ehClassificacao18,
} from "../../lib/historietasAdultContent";
import { SITE_URL } from "../../lib/seo";
// A resposta XML nao pode pular as barreiras, mesmo com payload no Data Cache.
export const revalidate = 0;

const ROTAS_ESTATICAS: MetadataRoute.Sitemap = [
  { url: SITE_URL, changeFrequency: "daily", priority: 1 },
  { url: `${SITE_URL}/explorar`, changeFrequency: "daily", priority: 0.9 },
  { url: `${SITE_URL}/em-alta`, changeFrequency: "daily", priority: 0.8 },
  { url: `${SITE_URL}/em-breve`, changeFrequency: "weekly", priority: 0.7 },
  { url: `${SITE_URL}/comunidade`, changeFrequency: "daily", priority: 0.8 },
  { url: `${SITE_URL}/ajuda`, changeFrequency: "monthly", priority: 0.5 },
  { url: `${SITE_URL}/termos`, changeFrequency: "monthly", priority: 0.4 },
  { url: `${SITE_URL}/termos-de-uso`, changeFrequency: "monthly", priority: 0.4 },
  {
    url: `${SITE_URL}/politica-de-privacidade`,
    changeFrequency: "monthly",
    priority: 0.4,
  },
  { url: `${SITE_URL}/excluir-conta`, changeFrequency: "monthly", priority: 0.5 },
  {
    url: `${SITE_URL}/diretrizes-da-comunidade`,
    changeFrequency: "monthly",
    priority: 0.4,
  },
];

export async function GET() {
  // Falha do primario nao e sitemap vazio nem autoriza servir a versao anterior.
  const { obras, capitulos } = await obterConteudoSitemapPublico();
  const { rotasObras, rotasCapitulos } = criarRotasConteudoPublicoSitemap({
    obras, capitulos, siteUrl: SITE_URL,
    conteudo18Bloqueado: ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO, ehClassificacao18,
  });
  return new Response(serializarSitemapPublico([...ROTAS_ESTATICAS, ...rotasObras, ...rotasCapitulos]), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
    },
  });
}
