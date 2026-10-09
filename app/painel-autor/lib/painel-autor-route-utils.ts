import { criarSlugBase, idObraSupabaseValido } from "../../../lib/utils";

export function criarLoginHrefPainelAutor() {
  const params = new URLSearchParams({
    redirectTo: "/painel-autor",
  });

  return `/login?${params.toString()}`;
}

export function criarPerfilAutorHref(
  autor: string,
  autorId?: string,
  userId?: string,
) {
  const autorLimpo = autor.trim() || "Autor não informado";
  const autorIdLimpo = autorId?.trim() || "";
  const userIdLimpo = userId?.trim() || autorIdLimpo;
  const params = new URLSearchParams();

  params.set("autor", autorLimpo);

  if (autorIdLimpo) {
    params.set("autorId", autorIdLimpo);
  }

  if (userIdLimpo) {
    params.set("userId", userIdLimpo);
  }

  return `/perfil-autor?${params.toString()}`;
}

export function criarHrefLeituraCapituloPainel(
  obra: { id: string; slug?: string; titulo: string; publicado: boolean },
  capitulo: { id: string },
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
