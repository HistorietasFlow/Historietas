import { criarSlugBase, idObraSupabaseValido } from "../../lib/utils";

type ObraLocalRotaHome = {
  id: string;
  slug?: string;
  titulo: string;
  publicado: boolean;
};

type CapituloLocalRotaHome = {
  id: string;
};

type ObraRotaHome = {
  titulo: string;
  disponivel: boolean;
};

export function criarLoginHrefHome() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/";
  const destinoSeguro =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/";
  const params = new URLSearchParams({
    redirectTo: destinoSeguro,
  });

  return `/login?${params.toString()}`;
}

export function criarHrefLeituraCapituloHome(
  obra: Pick<ObraLocalRotaHome, "id" | "slug" | "titulo" | "publicado">,
  capitulo: CapituloLocalRotaHome,
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

export function criarHrefObraCatalogoHome(obra: ObraRotaHome) {
  const obraComLink = obra as ObraRotaHome & { link?: string; slug?: string };
  const linkObra = obraComLink.link?.trim();

  if (linkObra) {
    return linkObra;
  }

  if (!obra.disponivel) {
    return "/explorar";
  }

  const slugObra = obraComLink.slug?.trim() || criarSlugBase(obra.titulo);

  return `/obra/${slugObra}`;
}

export function criarHrefPerfilAutorHome(nomeAutor: string, autorId = "") {
  const nomeAutorLimpo = nomeAutor.trim();
  const autorIdLimpo = autorId.trim();
  const parametros = new URLSearchParams();

  if (nomeAutorLimpo) {
    parametros.set("autor", nomeAutorLimpo);
  }

  if (autorIdLimpo) {
    parametros.set("autorId", autorIdLimpo);
    parametros.set("userId", autorIdLimpo);
  }

  const query = parametros.toString();

  return query ? `/perfil-autor?${query}` : "/perfil-autor";
}
