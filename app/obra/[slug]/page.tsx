import type { Metadata } from "next";
import ObraDinamicaClient from "./ObraDinamicaClient";
import { createClient } from "../../../lib/supabase/server";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type ObraMetadataRow = {
  titulo: string | null;
  autor: string | null;
  sinopse: string | null;
  capa_url: string | null;
  slug: string | null;
};

const SITE_NAME = "HISTORIETAS";
const DEFAULT_TITLE = "HISTORIETAS";
const DEFAULT_DESCRIPTION =
  "Leia histórias, contos, mangás, webnovels e publique suas próprias obras no HISTORIETAS.";

async function obterSlug(params: PageProps["params"]) {
  const paramsResolvidos = await params;
  return paramsResolvidos.slug.trim();
}

function limitarTexto(texto: string, limite: number) {
  const textoLimpo = texto.replace(/\s+/g, " ").trim();

  if (textoLimpo.length <= limite) {
    return textoLimpo;
  }

  return `${textoLimpo.slice(0, limite - 1).trim()}…`;
}

function criarMetadataPadrao(): Metadata {
  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    openGraph: {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
    },
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = await obterSlug(params);

  if (!slug) {
    return criarMetadataPadrao();
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("obras")
      .select("titulo,autor,sinopse,capa_url,slug")
      .eq("slug", slug)
      .eq("publicado", true)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return criarMetadataPadrao();
    }

    const obra = data as ObraMetadataRow;
    const tituloObra = obra.titulo?.trim() || "Obra no HISTORIETAS";
    const autorObra = obra.autor?.trim() || "Autor não informado";
    const sinopseObra = obra.sinopse?.trim() || DEFAULT_DESCRIPTION;
    const title = `${tituloObra} | ${SITE_NAME}`;
    const description = limitarTexto(`${sinopseObra} — por ${autorObra}`, 160);
    const capaUrl = obra.capa_url?.trim() || "";
    const images = capaUrl
      ? [
          {
            url: capaUrl,
            alt: `Capa de ${tituloObra}`,
          },
        ]
      : undefined;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        siteName: SITE_NAME,
        type: "article",
        images,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: capaUrl ? [capaUrl] : undefined,
      },
    };
  } catch {
    return criarMetadataPadrao();
  }
}

export default function ObraPage() {
  return <ObraDinamicaClient />;
}