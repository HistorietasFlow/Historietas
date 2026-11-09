import type { Metadata } from "next";
import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import ObraDinamicaClient from "./ObraDinamicaClient";
import { obterSnapshotObraPublica as carregarSnapshotObraPublica } from "../../../lib/cache/obrasPublicas";
import {
  DEFAULT_HISTORIETAS_LANGUAGE,
  type HistorietasLanguage,
} from "../../../lib/i18n";
import {
  criarJsonLdObraPublica,
  serializarJsonLdSeguro,
} from "../../../lib/seo/public-content-json-ld";
import {
  criarHrefCanonicoObra,
  criarMetadataObraNaoEncontrada,
  criarMetadataObraPublica,
  criarMetadataPadrao,
  normalizarSlugParametro,
  resolverIdiomaMetadata,
} from "./lib/obra-page-metadata-utils";

// Sem Full Route Cache/HTML cacheado: cada requisicao precisa da barreira.
export const revalidate = 0;

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

// Metadata e HTML compartilham apenas o snapshot confirmado DESTA requisicao.
// A barreira interna continua fazendo dois POSTs distintos, sem memoizacao.
const obterSnapshotObraPublica = cache(carregarSnapshotObraPublica);
async function obterObraMetadataPublica(slug: string) {
  const snapshot = await obterSnapshotObraPublica(slug);
  return snapshot ? { titulo: snapshot.obra.titulo, autor: snapshot.obra.autor,
    sinopse: snapshot.obra.sinopse, capa_url: snapshot.obra.capa, slug: snapshot.slug } : null;
}

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

  const snapshot = await obterSnapshotObraPublica(slug);
  const obra = await obterObraMetadataPublica(slug);

  if (!obra || !snapshot) {
    notFound();
  }

  const slugCanonico = normalizarSlugParametro(obra.slug) || slug;
  const dadosEstruturados = criarJsonLdObraPublica({
    hrefCanonico: criarHrefCanonicoObra(slugCanonico),
    nome: obra.titulo || "",
    descricao: obra.sinopse,
    autor: obra.autor,
    imagem: obra.capa_url,
  });

  return (
    <>
      <script
        id="obra-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializarJsonLdSeguro(dadosEstruturados),
        }}
      />
      <ObraDinamicaClient snapshotInicial={snapshot} />
    </>
  );
}
