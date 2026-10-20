export function criarLoginHrefConfiguracoes() {
  const params = new URLSearchParams({
    redirectTo: "/configuracoes",
  });

  return `/login?${params.toString()}`;
}
