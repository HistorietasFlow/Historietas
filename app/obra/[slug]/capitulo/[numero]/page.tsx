import { redirect } from "next/navigation";
import { supabase } from "../../../../../lib/supabase/client";

type PageProps = {
  params: Promise<{
    slug: string;
    numero: string;
  }>;
};

type ObraCapituloRouteRow = {
  id: string;
  slug: string | null;
  publicado: boolean | null;
};

type CapituloRouteRow = {
  id: string;
  obra_id: string;
  ordem: number | null;
  publicado: boolean | null;
};

function obterNumeroCapituloSeguro(valor: string) {
  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero < 1) {
    return 1;
  }

  return numero;
}

export default async function CapituloCanonicoPage({ params }: PageProps) {
  const { slug, numero } = await params;
  const slugSeguro = decodeURIComponent(slug || "").trim();
  const numeroCapitulo = obterNumeroCapituloSeguro(numero);

  if (!slugSeguro) {
    redirect("/explorar");
  }

  const { data: obraData, error: obraError } = await supabase
    .from("obras")
    .select("id, slug, publicado")
    .eq("slug", slugSeguro)
    .eq("publicado", true)
    .maybeSingle();

  if (obraError || !obraData) {
    redirect(`/obra/${encodeURIComponent(slugSeguro)}`);
  }

  const obra = obraData as ObraCapituloRouteRow;

  const { data: capituloData, error: capituloError } = await supabase
    .from("capitulos")
    .select("id, obra_id, ordem, publicado")
    .eq("obra_id", obra.id)
    .eq("ordem", numeroCapitulo)
    .eq("publicado", true)
    .maybeSingle();

  if (capituloError || !capituloData) {
    redirect(`/obra/${encodeURIComponent(slugSeguro)}`);
  }

  const capitulo = capituloData as CapituloRouteRow;

  redirect(
    `/ler-capitulo?obraId=${encodeURIComponent(
      obra.id
    )}&capituloId=${encodeURIComponent(capitulo.id)}`
  );
}