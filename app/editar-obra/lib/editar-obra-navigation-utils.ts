import { criarSlugBase } from "../../../lib/utils";

type ObraNavegacaoEditarObra = {
  link?: string;
  slug?: string;
  publicado?: boolean;
};

export function criarLoginHrefEditarObra(obraId?: string) {
  const obraIdLimpo = obraId?.trim() || "";
  const redirectTo = obraIdLimpo
    ? `/editar-obra?obraId=${encodeURIComponent(obraIdLimpo)}`
    : "/editar-obra";
  const params = new URLSearchParams({
    redirectTo,
  });

  return `/login?${params.toString()}`;
}

export function obterHrefsObraEditarObra(
  obraAtual: ObraNavegacaoEditarObra | null | undefined,
  titulo: string,
) {
  const obraPublicaHref =
    obraAtual?.link ||
    (obraAtual?.slug
      ? `/obra/${obraAtual.slug}`
      : titulo.trim()
        ? `/obra/${criarSlugBase(titulo.trim())}`
        : "/painel-autor");

  return {
    obraPublicaHref,
    minhaObraHref: obraAtual?.publicado ? obraPublicaHref : "/painel-autor",
  };
}
