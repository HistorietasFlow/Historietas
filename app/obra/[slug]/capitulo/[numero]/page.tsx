import { redirect } from "next/navigation";
import { obterRotaCapituloPublico } from "../../../../../lib/cache/obrasPublicas";
import {
  decodificarSlugSeguro,
  obterNumeroCapituloSeguro,
} from "./lib/obra-chapter-canonical-route-utils";

type PageProps = {
  params: Promise<{
    slug: string;
    numero: string;
  }>;
};

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

  const rotaCapitulo = await obterRotaCapituloPublico(
    slugSeguro,
    numeroCapitulo,
  ).catch(() => null);

  if (!rotaCapitulo) {
    redirect(obraHref);
  }

  const leituraParams = new URLSearchParams({
    obraId: rotaCapitulo.obraId,
    capituloId: rotaCapitulo.capituloId,
  });

  redirect(`/ler-capitulo?${leituraParams.toString()}`);
}
