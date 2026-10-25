import { criarSlugBase, idObraSupabaseValido } from "../../../lib/utils";

type ObraParaHrefLeitura = {
  id: string;
  slug: string;
  titulo: string;
  publicado: boolean;
};

export function criarLoginHrefEditarCapitulo(
  obraId?: string,
  capituloId?: string
) {
  const obraIdLimpo = obraId?.trim() || "";
  const capituloIdLimpo = capituloId?.trim() || "";
  const paramsEditor = new URLSearchParams();

  if (obraIdLimpo) {
    paramsEditor.set("obraId", obraIdLimpo);
  }

  if (capituloIdLimpo) {
    paramsEditor.set("capituloId", capituloIdLimpo);
  }

  const queryEditor = paramsEditor.toString();
  const redirectTo = queryEditor
    ? `/editar-capitulo?${queryEditor}`
    : "/editar-capitulo";
  const paramsLogin = new URLSearchParams({
    redirectTo,
  });

  return `/login?${paramsLogin.toString()}`;
}

export function criarHrefLeituraCapitulo(
  obra: ObraParaHrefLeitura,
  capituloId: string,
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
  )}&capituloId=${encodeURIComponent(capituloId)}`;
}
