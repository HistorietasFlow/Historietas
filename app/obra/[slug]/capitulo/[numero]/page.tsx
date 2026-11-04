import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LerCapituloClient } from "../../../../ler-capitulo/page";
import { obterLeituraCapituloPublico } from "../../../../../lib/cache/obrasPublicas";
import { criarMetadataPadrao } from "../../lib/obra-page-metadata-utils";
import {
  decodificarSlugSeguro,
  obterNumeroCapituloSeguro,
} from "./lib/obra-chapter-canonical-route-utils";
import { criarMetadataCapituloPublico } from "./lib/obra-chapter-metadata-utils";

type PageProps = {
  params: Promise<{
    slug: string;
    numero: string;
  }>;
};

async function obterParametrosSeguros(params: PageProps["params"]) {
  const { slug, numero } = await params;

  return {
    slug: decodificarSlugSeguro(slug || ""),
    numero: obterNumeroCapituloSeguro(numero || ""),
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, numero } = await obterParametrosSeguros(params);

  if (!slug || numero === null) {
    notFound();
  }

  let leitura;

  try {
    leitura = await obterLeituraCapituloPublico(slug, numero);
  } catch {
    return criarMetadataPadrao({ idioma: "pt-BR" });
  }

  if (!leitura) {
    notFound();
  }

  return criarMetadataCapituloPublico({ leitura, slug });
}

export default async function CapituloCanonicoPage({ params }: PageProps) {
  const { slug: slugSeguro, numero: numeroCapitulo } =
    await obterParametrosSeguros(params);

  if (!slugSeguro) {
    notFound();
  }

  if (numeroCapitulo === null) {
    notFound();
  }

  const leitura = await obterLeituraCapituloPublico(
    slugSeguro,
    numeroCapitulo,
  );

  if (!leitura) {
    notFound();
  }

  return (
    <LerCapituloClient
      dadosIniciais={{
        obraId: leitura.obraId,
        capituloId: leitura.capituloId,
        obras: [leitura.obra],
      }}
    />
  );
}
