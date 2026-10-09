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
