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
const DEFAULT_DESCRIPTION =
  "Leia histórias, contos, mangás, webnovels e publique suas próprias obras no HISTORIETAS.";
const NOT_FOUND_TITLE = "Obra não encontrada";

function normalizarSlugParametro(valor: unknown) {
  if (typeof valor !== "string") {
    return "";
  }

  const valorLimpo = valor.trim();

  if (!valorLimpo) {
    return "";
  }

  try {
    const slugDecodificado = decodeURIComponent(valorLimpo).trim();

    if (
      !slugDecodificado ||
      slugDecodificado.includes("/") ||
      slugDecodificado.includes("\\") ||
      /[\u0000-\u001F\u007F]/.test(slugDecodificado) ||
      slugDecodificado.length > 180
    ) {
      return "";
    }

    return slugDecodificado;
  } catch {
    return "";
  }
}

async function obterSlug(params: PageProps["params"]) {
  const paramsResolvidos = await params;

  return normalizarSlugParametro(paramsResolvidos.slug);
}

function limitarTexto(texto: string, limite: number) {
  const textoLimpo = texto.replace(/\s+/g, " ").trim();

  if (textoLimpo.length <= limite) {
    return textoLimpo;
  }

  return `${textoLimpo.slice(0, Math.max(0, limite - 1)).trim()}…`;
}

function criarHrefCanonicoObra(slug: string) {
  return `/obra/${encodeURIComponent(slug)}`;
}

function obterUrlImagemSegura(valor: string | null) {
  const valorLimpo = valor?.trim() || "";

  if (!valorLimpo) {
    return "";
  }

  try {
    const url = new URL(valorLimpo);

    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : "";
  } catch {
    return "";
  }
}

function criarMetadataPadrao({
  titulo = SITE_NAME,
  noIndex = false,
}: {
  titulo?: string;
  noIndex?: boolean;
} = {}): Metadata {
  return {
    title: titulo,
    description: DEFAULT_DESCRIPTION,
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
    openGraph: {
      title: titulo,
      description: DEFAULT_DESCRIPTION,
      siteName: SITE_NAME,
      locale: "pt_BR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: DEFAULT_DESCRIPTION,
    },
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = await obterSlug(params);

  if (!slug) {
    return criarMetadataPadrao({
      titulo: NOT_FOUND_TITLE,
      noIndex: true,
    });
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
      return criarMetadataPadrao({
        titulo: NOT_FOUND_TITLE,
        noIndex: true,
      });
    }

    const obra = data as ObraMetadataRow;
    const tituloObra = limitarTexto(
      obra.titulo?.trim() || "Obra no HISTORIETAS",
      100,
    );
    const autorObra = limitarTexto(
      obra.autor?.trim() || "Autor não informado",
      80,
    );
    const sinopseObra = obra.sinopse?.trim() || DEFAULT_DESCRIPTION;
    const description = limitarTexto(`${sinopseObra} — por ${autorObra}`, 160);
    const capaUrl = obterUrlImagemSegura(obra.capa_url);
    const slugCanonico = normalizarSlugParametro(obra.slug) || slug;
    const hrefCanonico = criarHrefCanonicoObra(slugCanonico);
    const tituloSocial = `${tituloObra} | ${SITE_NAME}`;
    const images = capaUrl
      ? [
          {
            url: capaUrl,
            alt: `Capa de ${tituloObra}`,
          },
        ]
      : undefined;

    return {
      title: tituloObra,
      description,
      authors: [{ name: autorObra }],
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