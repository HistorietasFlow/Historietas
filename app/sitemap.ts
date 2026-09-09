import type { MetadataRoute } from "next";
import {
  ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO,
  ehClassificacao18,
} from "../lib/historietasAdultContent";
import { SITE_URL } from "../lib/seo";
import {
  carregarTodasPaginasSupabase,
  TAMANHO_PAGINA_SUPABASE,
} from "../lib/supabase/paginacao.mjs";
import {
  criarSupabasePublicClient,
  supabasePublicoConfigurado,
} from "../lib/supabase/public";

export const revalidate = 3600;

type ObraSitemap = {
  slug: string;
  atualizado_em: string;
  classificacao_indicativa: string;
};

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

function normalizarSlugSitemap(valor: unknown) {
  if (typeof valor !== "string") return "";

  const slug = valor.trim();

  return slug &&
    slug.length <= 180 &&
    !slug.includes("/") &&
    !slug.includes("\\") &&
    !/[\u0000-\u001F\u007F]/.test(slug)
    ? slug
    : "";
}

function obterDataValida(valor: unknown) {
  if (typeof valor !== "string" || !valor.trim()) return undefined;

  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? undefined : data;
}

async function listarObrasPublicadas(): Promise<ObraSitemap[]> {
  if (!supabasePublicoConfigurado) return [];

  const supabase = criarSupabasePublicClient();

  return carregarTodasPaginasSupabase<ObraSitemap>({
    nomeColecao: "obras publicadas do sitemap",
    tamanhoPagina: TAMANHO_PAGINA_SUPABASE,
    buscarPagina: async (inicio, fim) => {
      const { data, error } = await supabase
        .from("obras")
        .select("slug,atualizado_em,classificacao_indicativa")
        .eq("publicado", true)
        .order("slug", { ascending: true })
        .range(inicio, fim);

      return { data, error };
    },
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const obras = await listarObrasPublicadas();
    const slugsIncluidos = new Set<string>();
    const rotasObras: MetadataRoute.Sitemap = [];

    for (const obra of obras) {
      const slug = normalizarSlugSitemap(obra.slug);

      if (
        !slug ||
        slugsIncluidos.has(slug) ||
        (ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO &&
          ehClassificacao18(obra.classificacao_indicativa))
      ) {
        continue;
      }

      slugsIncluidos.add(slug);
      rotasObras.push({
        url: `${SITE_URL}/obra/${encodeURIComponent(slug)}`,
        lastModified: obterDataValida(obra.atualizado_em),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    return [...ROTAS_ESTATICAS, ...rotasObras];
  } catch (error) {
    console.error(
      "Não foi possível adicionar as obras publicadas ao sitemap.",
      error,
    );
    return ROTAS_ESTATICAS;
  }
}
