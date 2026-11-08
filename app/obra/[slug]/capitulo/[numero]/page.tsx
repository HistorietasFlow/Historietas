import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { LerCapituloClient } from "../../../../ler-capitulo/page";
import { obterLeituraCapituloPublico as carregarLeituraCapituloPublico } from "../../../../../lib/cache/obrasPublicas";
import {
  criarJsonLdCapituloPublico,
  serializarJsonLdSeguro,
} from "../../../../../lib/seo/public-content-json-ld";
import {
  criarHrefCanonicoObra,
  criarMetadataPadrao,
} from "../../lib/obra-page-metadata-utils";
import {
  decodificarSlugSeguro,
  obterNumeroCapituloSeguro,
} from "./lib/obra-chapter-canonical-route-utils";
import {
  criarHrefCanonicoCapitulo,
  criarMetadataCapituloPublico,
} from "./lib/obra-chapter-metadata-utils";

export const revalidate = 0;
const obterLeituraCapituloPublico = cache(carregarLeituraCapituloPublico);

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

  const capitulo = leitura.obra.capitulos.find(
    (item) => item.id === leitura.capituloId,
  );
  const slugCanonico = leitura.obra.slug || slugSeguro;
  const dadosEstruturados = criarJsonLdCapituloPublico({
    hrefCanonico: criarHrefCanonicoCapitulo(
      slugCanonico,
      leitura.numeroCapitulo,
    ),
    nome: capitulo?.titulo || `Capítulo ${leitura.numeroCapitulo}`,
    posicao: leitura.numeroCapitulo,
    descricao:
      leitura.dadosEstruturados.textoCapitulo ||
      leitura.dadosEstruturados.sinopse,
    autor: leitura.dadosEstruturados.autor,
    imagem: leitura.dadosEstruturados.capa,
    obra: {
      hrefCanonico: criarHrefCanonicoObra(slugCanonico),
      nome: leitura.obra.titulo,
    },
  });

  return (
    <>
      <script
        id="capitulo-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializarJsonLdSeguro(dadosEstruturados),
        }}
      />
      <LerCapituloClient
        dadosIniciais={{
          obraId: leitura.obraId,
          capituloId: leitura.capituloId,
          obras: [leitura.obra],
        }}
      />
    </>
  );
}
