import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import ObraDinamicaClient from "./ObraDinamicaClient";
import { obterObraMetadataPublica } from "../../../lib/cache/obrasPublicas";
import {
  DEFAULT_HISTORIETAS_LANGUAGE,
  type HistorietasLanguage,
} from "../../../lib/i18n";
import {
  criarMetadataObraNaoEncontrada,
  criarMetadataObraPublica,
  criarMetadataPadrao,
  normalizarSlugParametro,
  resolverIdiomaMetadata,
} from "./lib/obra-page-metadata-utils";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function obterSlug(params: PageProps["params"]) {
  const paramsResolvidos = await params;

  return normalizarSlugParametro(paramsResolvidos.slug);
}

async function obterIdiomaMetadata(): Promise<HistorietasLanguage> {
  try {
    const cabecalhos = await headers();

    return resolverIdiomaMetadata(cabecalhos.get("accept-language") || "");
  } catch {
    return DEFAULT_HISTORIETAS_LANGUAGE;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const [slug, idioma] = await Promise.all([
    obterSlug(params),
    obterIdiomaMetadata(),
  ]);

  if (!slug) {
    return criarMetadataObraNaoEncontrada(idioma);
  }

  try {
    const obra = await obterObraMetadataPublica(slug);

    if (!obra) {
      return criarMetadataObraNaoEncontrada(idioma);
    }

    return criarMetadataObraPublica({
      obra,
      slugSolicitado: slug,
      idioma,
    });
  } catch {
    return criarMetadataPadrao({ idioma });
  }
}

export default async function ObraPage({ params }: PageProps) {
  const slug = await obterSlug(params);

  if (!slug) {
    notFound();
  }

  const obra = await obterObraMetadataPublica(slug);

  if (!obra) {
    notFound();
  }

  return <ObraDinamicaClient />;
}
