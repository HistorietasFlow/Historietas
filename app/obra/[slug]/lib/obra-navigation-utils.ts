export async function criarLoginHrefObraPublica() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/obra";
  const destinoSeguro =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/obra";
  const params = new URLSearchParams({
    redirectTo: destinoSeguro,
  });

  return `/login?${params.toString()}`;
}

export function criarLinkComunidadeObra(
  titulo: string,
  filtro?: "Teoria" | "Review" | "posts",
) {
  const params = new URLSearchParams();

  params.set("obra", titulo);

  if (filtro === "posts") {
    params.set("grupo", "posts");
  } else if (filtro) {
    params.set("tipo", filtro);
  }

  return `/comunidade?${params.toString()}`;
}

export function criarLinkPerfilAutor(autor: string, autorId?: string) {
  const params = new URLSearchParams();
  const autorLimpo = autor.trim() || "Autor não informado";
  const autorIdLimpo = autorId?.trim() || "";

  params.set("autor", autorLimpo);

  if (autorIdLimpo) {
    params.set("autorId", autorIdLimpo);
    params.set("userId", autorIdLimpo);
  }

  return `/perfil-autor?${params.toString()}`;
}
