import { criarSlugBase, idObraSupabaseValido } from "../../../lib/utils";

type ObraParaHrefLeituraAdicionarCapitulo = {
  id: string;
  slug: string;
  titulo: string;
  publicado: boolean;
};

type CapituloParaHrefLeituraAdicionarCapitulo = {
  id: string;
};

export function criarLoginHrefAdicionarCapitulo(obraId?: string) {
  const obraIdLimpo = obraId?.trim() || "";
  const redirectTo = obraIdLimpo
    ? `/adicionar-capitulo?obraId=${encodeURIComponent(obraIdLimpo)}`
    : "/adicionar-capitulo";
  const params = new URLSearchParams({
    redirectTo,
  });

  return `/login?${params.toString()}`;
}

export function criarHrefLeituraCapitulo(
  obra: ObraParaHrefLeituraAdicionarCapitulo,
  capitulo: CapituloParaHrefLeituraAdicionarCapitulo,
  numeroCapitulo: number
) {
  const slugSeguro = obra.slug?.trim() || criarSlugBase(obra.titulo);

  if (
    obra.publicado &&
    idObraSupabaseValido(obra.id) &&
    slugSeguro &&
    Number.isInteger(numeroCapitulo) &&
    numeroCapitulo > 0
  ) {
    return `/obra/${encodeURIComponent(slugSeguro)}/capitulo/${numeroCapitulo}`;
  }

  return `/ler-capitulo?obraId=${encodeURIComponent(
    obra.id
  )}&capituloId=${encodeURIComponent(capitulo.id)}`;
}
