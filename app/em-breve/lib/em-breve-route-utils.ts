export function pegarParametro(parametro?: string | string[] | null) {
  if (Array.isArray(parametro)) {
    return parametro[0]?.trim() || "";
  }

  return parametro?.trim() || "";
}

export function criarLoginHrefEmBreve() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/em-breve";
  const destinoSeguro =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/em-breve";
  const params = new URLSearchParams({
    redirectTo: destinoSeguro,
  });

  return `/login?${params.toString()}`;
}
