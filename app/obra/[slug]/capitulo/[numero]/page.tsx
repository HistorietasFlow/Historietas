import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LerCapituloClient } from "../../../../ler-capitulo/page";
import { obterLeituraCapituloPublico } from "../../../../../lib/cache/obrasPublicas";
import {
  criarMetadataObraNaoEncontrada,
  criarMetadataPadrao,
} from "../../lib/obra-page-metadata-utils";
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
    return criarMetadataObraNaoEncontrada("pt-BR");
  }

  try {
    const leitura = await obterLeituraCapituloPublico(slug, numero);

    return leitura
      ? criarMetadataCapituloPublico({ leitura, slug })
      : criarMetadataObraNaoEncontrada("pt-BR");
  } catch {
    return criarMetadataPadrao({ idioma: "pt-BR" });
  }
}

export default async function CapituloCanonicoPage({ params }: PageProps) {
  const { slug: slugSeguro, numero: numeroCapitulo } =
    await obterParametrosSeguros(params);

  if (!slugSeguro) {
    redirect("/explorar");
  }

  const obraHref = `/obra/${encodeURIComponent(slugSeguro)}`;

  if (numeroCapitulo === null) {
    redirect(obraHref);
  }

  const leitura = await obterLeituraCapituloPublico(
    slugSeguro,
    numeroCapitulo,
  ).catch(() => null);

  if (!leitura) {
    redirect(obraHref);
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
