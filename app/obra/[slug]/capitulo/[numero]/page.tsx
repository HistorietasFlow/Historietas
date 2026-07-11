import { redirect } from "next/navigation";
import { criarSupabaseServerClient } from "../../../../../lib/supabase/server";

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

  if (!slug) {
    return "";
  }

  try {
    return decodeURIComponent(slug).trim();
  } catch {
    return "";
  }
}

function obterNumeroCapituloSeguro(valor: string) {
  const numero = Number(valor);

  return Number.isInteger(numero) && numero >= 1 ? numero : null;
}

export default async function CapituloCanonicoPage({ params }: PageProps) {
  const { slug, numero } = await params;
  const slugSeguro = decodificarSlugSeguro(slug || "");
  const numeroCapitulo = obterNumeroCapituloSeguro(numero);

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

  redirect(
    `/ler-capitulo?obraId=${encodeURIComponent(
      obra.id,
    )}&capituloId=${encodeURIComponent(capitulo.id)}`,
  );
}