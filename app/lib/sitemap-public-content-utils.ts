import type { MetadataRoute } from "next";

export type ObraPublicaSitemap = {
  id: string;
  slug: string;
  atualizado_em: string | null;
  classificacao_indicativa: string | null;
  publicado: boolean | null;
};

export type CapituloPublicoSitemap = {
  obra_id: string;
  ordem: number | null;
  atualizado_em: string | null;
  publicado: boolean | null;
};

export function normalizarSlugSitemap(valor: unknown) {
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

export function criarRotasConteudoPublicoSitemap({
  obras,
  capitulos,
  siteUrl,
  conteudo18Bloqueado,
  ehClassificacao18,
}: {
  obras: ObraPublicaSitemap[];
  capitulos: CapituloPublicoSitemap[];
  siteUrl: string;
  conteudo18Bloqueado: boolean;
  ehClassificacao18: (classificacao: unknown) => boolean;
}) {
  const obrasPermitidas = new Map<
    string,
    { slug: string; atualizadoEm: string | null }
  >();
  const slugsIncluidos = new Set<string>();
  const rotasObras: MetadataRoute.Sitemap = [];

  for (const obra of obras) {
    const obraId = typeof obra.id === "string" ? obra.id.trim() : "";
    const slug = normalizarSlugSitemap(obra.slug);

    if (
      !obraId ||
      !obra.publicado ||
      !slug ||
      slugsIncluidos.has(slug) ||
      (conteudo18Bloqueado &&
        ehClassificacao18(obra.classificacao_indicativa))
    ) {
      continue;
    }

    slugsIncluidos.add(slug);
    obrasPermitidas.set(obraId, {
      slug,
      atualizadoEm: obra.atualizado_em,
    });
    rotasObras.push({
      url: `${siteUrl}/obra/${encodeURIComponent(slug)}`,
      lastModified: obterDataValida(obra.atualizado_em),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  const capitulosIncluidos = new Set<string>();
  const rotasCapitulos: MetadataRoute.Sitemap = [];

  for (const capitulo of capitulos) {
    const obra = obrasPermitidas.get(capitulo.obra_id);
    const ordem = Number(capitulo.ordem);

    if (
      !obra ||
      !capitulo.publicado ||
      !Number.isSafeInteger(ordem) ||
      ordem < 1
    ) {
      continue;
    }

    const chaveCapitulo = `${capitulo.obra_id}:${ordem}`;

    if (capitulosIncluidos.has(chaveCapitulo)) {
      continue;
    }

    capitulosIncluidos.add(chaveCapitulo);
    rotasCapitulos.push({
      url: `${siteUrl}/obra/${encodeURIComponent(obra.slug)}/capitulo/${ordem}`,
      lastModified: obterDataValida(capitulo.atualizado_em),
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return { rotasObras, rotasCapitulos };
}
