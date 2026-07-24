import type { Metadata } from "next";
import { headers } from "next/headers";
import ObraDinamicaClient from "./ObraDinamicaClient";
import { criarSupabaseServerClient } from "../../../lib/supabase/server";
import {
  DEFAULT_HISTORIETAS_LANGUAGE,
  normalizeHistorietasLanguage,
  type HistorietasLanguage,
} from "../../../lib/i18n";

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

type TextosMetadataObra = {
  descricaoPadrao: string;
  tituloNaoEncontrado: string;
  tituloObraFallback: string;
  autorFallback: string;
  separadorAutor: string;
  capaDe: string;
  localeOpenGraph: "pt_BR" | "en_US" | "es_ES";
};

const SITE_NAME = "HISTORIETAS";

const TEXTOS_METADATA_OBRA: Record<HistorietasLanguage, TextosMetadataObra> = {
  "pt-BR": {
    descricaoPadrao:
      "Leia histórias, contos, mangás, webnovels e publique suas próprias obras no HISTORIETAS.",
    tituloNaoEncontrado: "Obra não encontrada",
    tituloObraFallback: "Obra no HISTORIETAS",
    autorFallback: "Autor não informado",
    separadorAutor: "por",
    capaDe: "Capa de",
    localeOpenGraph: "pt_BR",
  },
  en: {
    descricaoPadrao:
      "Read stories, short fiction, manga and web novels, and publish your own works on HISTORIETAS.",
    tituloNaoEncontrado: "Work not found",
    tituloObraFallback: "Work on HISTORIETAS",
    autorFallback: "Author not provided",
    separadorAutor: "by",
    capaDe: "Cover of",
    localeOpenGraph: "en_US",
  },
  es: {
    descricaoPadrao:
      "Lee historias, cuentos, mangas y webnovels, y publica tus propias obras en HISTORIETAS.",
    tituloNaoEncontrado: "Obra no encontrada",
    tituloObraFallback: "Obra en HISTORIETAS",
    autorFallback: "Autor no informado",
    separadorAutor: "por",
    capaDe: "Portada de",
    localeOpenGraph: "es_ES",
  },
};

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

function resolverIdiomaMetadata(
  acceptLanguage: string,
): HistorietasLanguage {
  const idiomasSolicitados = acceptLanguage
    .split(",")
    .map((parte) => parte.split(";")[0]?.trim().toLowerCase() || "")
    .filter(Boolean);

  for (const idiomaSolicitado of idiomasSolicitados) {
    if (
      idiomaSolicitado.startsWith("pt") ||
      idiomaSolicitado.startsWith("en") ||
      idiomaSolicitado.startsWith("es")
    ) {
      return normalizeHistorietasLanguage(idiomaSolicitado);
    }
  }

  return DEFAULT_HISTORIETAS_LANGUAGE;
}

async function obterIdiomaMetadata(): Promise<HistorietasLanguage> {
  try {
    const cabecalhos = await headers();

    return resolverIdiomaMetadata(cabecalhos.get("accept-language") || "");
  } catch {
    return DEFAULT_HISTORIETAS_LANGUAGE;
  }
}

function criarMetadataPadrao({
  idioma = DEFAULT_HISTORIETAS_LANGUAGE,
  titulo,
  noIndex = false,
}: {
  idioma?: HistorietasLanguage;
  titulo?: string;
  noIndex?: boolean;
} = {}): Metadata {
  const textos = TEXTOS_METADATA_OBRA[idioma];
  const tituloFinal = titulo || SITE_NAME;

  return {
    title: tituloFinal,
    description: textos.descricaoPadrao,
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
    openGraph: {
      title: tituloFinal,
      description: textos.descricaoPadrao,
      siteName: SITE_NAME,
      locale: textos.localeOpenGraph,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: tituloFinal,
      description: textos.descricaoPadrao,
    },
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const [slug, idioma] = await Promise.all([
    obterSlug(params),
    obterIdiomaMetadata(),
  ]);
  const textos = TEXTOS_METADATA_OBRA[idioma];

  if (!slug) {
    return criarMetadataPadrao({
      idioma,
      titulo: textos.tituloNaoEncontrado,
      noIndex: true,
    });
  }

  try {
    const supabase = await criarSupabaseServerClient();
    const { data, error } = await supabase
      .from("obras")
      .select("titulo,autor,sinopse,capa_url,slug")
      .eq("slug", slug)
      .eq("publicado", true)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return criarMetadataPadrao({
        idioma,
        titulo: textos.tituloNaoEncontrado,
        noIndex: true,
      });
    }

    const obra = data as ObraMetadataRow;
    const tituloObra = limitarTexto(
      obra.titulo?.trim() || textos.tituloObraFallback,
      100,
    );
    const autorObra = limitarTexto(
      obra.autor?.trim() || textos.autorFallback,
      80,
    );
    const sinopseObra = obra.sinopse?.trim() || textos.descricaoPadrao;
    const description = limitarTexto(
      `${sinopseObra} — ${textos.separadorAutor} ${autorObra}`,
      160,
    );
    const capaUrl = obterUrlImagemSegura(obra.capa_url);
    const slugCanonico = normalizarSlugParametro(obra.slug) || slug;
    const hrefCanonico = criarHrefCanonicoObra(slugCanonico);
    const tituloSocial = `${tituloObra} | ${SITE_NAME}`;
    const images = capaUrl
      ? [
          {
            url: capaUrl,
            alt: `${textos.capaDe} ${tituloObra}`,
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
        locale: textos.localeOpenGraph,
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
    return criarMetadataPadrao({ idioma });
  }
}

export default function ObraPage() {
  return <ObraDinamicaClient />;
}