import { redirect } from "next/navigation";
import { criarSupabaseServerClient } from "../../../../../lib/supabase/server";
import { idObraSupabaseValido } from "../../../../../lib/utils";

type PageProps = {
  params: Promise<{
    slug: string;
    numero: string;
  }>;
};

type ObraCapituloRouteRow = {
  id: string;
};

type CapituloRouteRow = {
  id: string;
};

function decodificarSlugSeguro(valor: string) {
  const slug = valor.trim();

  if (!slug || slug.length > 180) {
    return "";
  }

  try {
    const slugDecodificado = decodeURIComponent(slug).trim();

    if (
      !slugDecodificado ||
      slugDecodificado.length > 180 ||
      slugDecodificado.includes("/") ||
      slugDecodificado.includes("\\") ||
      /[\u0000-\u001F\u007F]/.test(slugDecodificado)
    ) {
      return "";
    }

    return slugDecodificado;
  } catch {
    return "";
  }
}

function obterNumeroCapituloSeguro(valor: string) {
  const numeroTexto = valor.trim();

  if (!/^[1-9]\d*$/.test(numeroTexto)) {
    return null;
  }

  const numero = Number(numeroTexto);

  return Number.isSafeInteger(numero) ? numero : null;
}

export default async function CapituloCanonicoPage({ params }: PageProps) {
  const { slug, numero } = await params;
  const slugSeguro = decodificarSlugSeguro(slug || "");
  const numeroCapitulo = obterNumeroCapituloSeguro(numero || "");

  if (!slugSeguro) {
    redirect("/explorar");
  }

  const obraHref = `/obra/${encodeURIComponent(slugSeguro)}`;

  if (numeroCapitulo === null) {
    redirect(obraHref);
  }

  const supabase = await criarSupabaseServerClient();

  const { data: obraData, error: obraError } = await supabase
    .from("obras")
    .select("id")
    .eq("slug", slugSeguro)
    .eq("publicado", true)
    .limit(1)
    .maybeSingle();

  if (obraError || !obraData) {
    redirect(obraHref);
  }

  const obra = obraData as ObraCapituloRouteRow;

  if (!idObraSupabaseValido(obra.id)) {
    redirect(obraHref);
  }

  const { data: capituloData, error: capituloError } = await supabase
    .from("capitulos")
    .select("id")
    .eq("obra_id", obra.id)
    .eq("ordem", numeroCapitulo)
    .eq("publicado", true)
    .limit(1)
    .maybeSingle();

  if (capituloError || !capituloData) {
    redirect(obraHref);
  }

  const capitulo = capituloData as CapituloRouteRow;

  if (!idObraSupabaseValido(capitulo.id)) {
    redirect(obraHref);
  }

  const leituraParams = new URLSearchParams({
    obraId: obra.id,
    capituloId: capitulo.id,
  });

  redirect(`/ler-capitulo?${leituraParams.toString()}`);
}