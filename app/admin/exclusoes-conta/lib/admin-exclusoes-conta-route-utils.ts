export function criarLoginHrefAdminExclusoesConta() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/admin/exclusoes-conta";
  const destino =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/admin/exclusoes-conta";

  return `/login?${new URLSearchParams({ redirectTo: destino }).toString()}`;
}
