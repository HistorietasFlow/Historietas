import { redirect } from "next/navigation";
import { obterRotaCapituloPublico } from "../../../../../lib/cache/obrasPublicas";

type PageProps = {
  params: Promise<{
    slug: string;
    numero: string;
  }>;
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
