export function criarLoginHrefPublicar() {
  const params = new URLSearchParams({
    redirectTo: "/publicar",
  });

  return `/login?${params.toString()}`;
}

export function obterNomeMetadataPublicar(usuario: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}) {
  const metadata = usuario.user_metadata || {};
  const nomesPossiveis = [
    metadata.nome,
    metadata.name,
    metadata.full_name,
    metadata.username,
    metadata.user_name,
    metadata.preferred_username,
  ];

  const nomeMetadata = nomesPossiveis.find((valor): valor is string => {
    return typeof valor === "string" && Boolean(valor.trim());
  });

  if (nomeMetadata?.trim()) {
    return nomeMetadata.trim();
  }

  const email = typeof usuario.email === "string" ? usuario.email.trim() : "";

  return email ? email.split("@")[0] || "" : "";
}
