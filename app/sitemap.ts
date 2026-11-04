import type { MetadataRoute } from "next";
import {
  criarRotasConteudoPublicoSitemap,
  type CapituloPublicoSitemap,
  type ObraPublicaSitemap,
} from "./lib/sitemap-public-content-utils";
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

async function listarObrasPublicadas(): Promise<ObraPublicaSitemap[]> {
  if (!supabasePublicoConfigurado) return [];

  const supabase = criarSupabasePublicClient();

  return carregarTodasPaginasSupabase<ObraPublicaSitemap>({
    nomeColecao: "obras publicadas do sitemap",
    tamanhoPagina: TAMANHO_PAGINA_SUPABASE,
    buscarPagina: async (inicio, fim) => {
      const { data, error } = await supabase
        .from("obras")
        .select("id,slug,atualizado_em,classificacao_indicativa,publicado")
        .eq("publicado", true)
        .order("slug", { ascending: true })
        .order("id", { ascending: true })
        .range(inicio, fim);

      return { data, error };
    },
  });
}

async function listarCapitulosPublicados(): Promise<CapituloPublicoSitemap[]> {
  if (!supabasePublicoConfigurado) return [];

  const supabase = criarSupabasePublicClient();

  return carregarTodasPaginasSupabase<CapituloPublicoSitemap>({
    nomeColecao: "capítulos publicados do sitemap",
    tamanhoPagina: TAMANHO_PAGINA_SUPABASE,
    buscarPagina: async (inicio, fim) => {
      const { data, error } = await supabase
        .from("capitulos")
        .select("obra_id,ordem,atualizado_em,publicado")
        .eq("publicado", true)
        .order("obra_id", { ascending: true })
        .order("ordem", { ascending: true })
        .range(inicio, fim);

      return { data, error };
    },
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const obras = await listarObrasPublicadas();
    const criarRotas = (capitulos: CapituloPublicoSitemap[]) =>
      criarRotasConteudoPublicoSitemap({
        obras,
        capitulos,
        siteUrl: SITE_URL,
        conteudo18Bloqueado: ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO,
        ehClassificacao18,
      });
    const { rotasObras } = criarRotas([]);

    try {
      const capitulos = await listarCapitulosPublicados();
      const { rotasCapitulos } = criarRotas(capitulos);

      return [...ROTAS_ESTATICAS, ...rotasObras, ...rotasCapitulos];
    } catch (error) {
      console.error(
        "Não foi possível adicionar os capítulos publicados ao sitemap.",
        error,
      );
      return [...ROTAS_ESTATICAS, ...rotasObras];
    }
  } catch (error) {
    console.error(
      "Não foi possível adicionar as obras publicadas ao sitemap.",
      error,
    );
    return ROTAS_ESTATICAS;
  }
}
