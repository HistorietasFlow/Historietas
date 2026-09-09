import type { Metadata } from "next";

export const SITE_URL = "https://www.historietas.com.br";
export const SITE_NAME = "Historietas";
export const SITE_TITLE = "Historietas — Leia, descubra e publique histórias";
export const SITE_DESCRIPTION =
  "Leia, descubra e publique webnovels, fanfics, mangás e histórias originais no Historietas.";

type OpcoesMetadataPagina = {
  titulo: string;
  descricao: string;
  caminho: `/${string}`;
};

export function criarMetadataPagina({
  titulo,
  descricao,
  caminho,
}: OpcoesMetadataPagina): Metadata {
  const tituloSocial = `${titulo} | ${SITE_NAME}`;

  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: caminho },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: caminho,
      siteName: SITE_NAME,
      title: tituloSocial,
      description: descricao,
    },
    twitter: {
      card: "summary_large_image",
      title: tituloSocial,
      description: descricao,
    },
  };
}
