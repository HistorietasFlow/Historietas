export function criarLoginHrefAdminProblemasTecnicos() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/admin/problemas-tecnicos";
  const destino =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/admin/problemas-tecnicos";

  return `/login?${new URLSearchParams({ redirectTo: destino }).toString()}`;
}
