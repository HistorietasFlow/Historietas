export function criarLoginHrefPerfilAutor() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/perfil-autor";
  const destinoSeguro =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/perfil-autor";
  const params = new URLSearchParams({
    redirectTo: destinoSeguro,
  });

  return `/login?${params.toString()}`;
}
