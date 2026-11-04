import type { Metadata } from "next";
import type { LeituraCapituloPublico } from "../../../../../../lib/cache/obrasPublicas";
import { SITE_NAME } from "../../../../../../lib/seo";
import {
  limitarTexto,
  obterUrlImagemSegura,
} from "../../../lib/obra-page-metadata-utils";

export function criarHrefCanonicoCapitulo(slug: string, numero: number) {
  return `/obra/${encodeURIComponent(slug)}/capitulo/${numero}`;
}

export function criarMetadataCapituloPublico({
  leitura,
  slug,
}: {
  leitura: LeituraCapituloPublico;
  slug: string;
}): Metadata {
  const capitulo = leitura.obra.capitulos.find(
    (item) => item.id === leitura.capituloId,
  );
  const tituloCapitulo = limitarTexto(
    capitulo?.titulo.trim() || `Capítulo ${leitura.numeroCapitulo}`,
    90,
  );
  const tituloObra = limitarTexto(leitura.obra.titulo, 90);
  const titulo = `${tituloCapitulo} — ${tituloObra}`;
  const descricaoBase =
    capitulo?.texto.trim() || leitura.obra.sinopse.trim() || titulo;
  const description = limitarTexto(descricaoBase, 160);
  const autor = limitarTexto(leitura.obra.autor, 80);
  const hrefCanonico = criarHrefCanonicoCapitulo(slug, leitura.numeroCapitulo);
  const capaUrl = obterUrlImagemSegura(leitura.obra.capa);
  const tituloSocial = `${titulo} | ${SITE_NAME}`;
  const images = capaUrl ? [capaUrl] : undefined;

  return {
    title: titulo,
    description,
    authors: [{ name: autor }],
    alternates: {
      canonical: hrefCanonico,
    },
    openGraph: {
      title: tituloSocial,
      description,
      siteName: SITE_NAME,
      locale: "pt_BR",
      type: "article",
      url: hrefCanonico,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: tituloSocial,
      description,
      images,
    },
  };
}
