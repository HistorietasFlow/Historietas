export type AppMetadataAdminConfiguracoes = {
  role?: unknown;
  roles?: unknown;
  cargo?: unknown;
  tipo_usuario?: unknown;
  admin?: unknown;
  is_admin?: unknown;
  moderator?: unknown;
};

export function pegarTexto(valor: unknown, fallback = "") {
  return typeof valor === "string" && valor.trim() ? valor.trim() : fallback;
}

export function normalizarUsernameConfiguracoes(valor: string) {
  return valor
    .trim()
    .replace(/^@+/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._]+/g, ".")
    .replace(/[._]{2,}/g, ".")
    .replace(/^[._]+|[._]+$/g, "")
    .slice(0, 30);
}

export function idUsuarioSupabaseValido(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function valorTextoAdminConfiguracoes(valor: unknown) {
  return typeof valor === "string" ? valor.trim().toLowerCase() : "";
}

export function metadataTemAdminConfiguracoes(
  appMetadata: AppMetadataAdminConfiguracoes | null | undefined,
) {
  if (!appMetadata || typeof appMetadata !== "object") {
    return false;
  }

  const cargosPermitidos = new Set(["admin", "moderador", "moderator"]);
  const roles = Array.isArray(appMetadata.roles)
    ? appMetadata.roles.map(valorTextoAdminConfiguracoes)
    : [];

  return (
    [
      valorTextoAdminConfiguracoes(appMetadata.role),
      valorTextoAdminConfiguracoes(appMetadata.cargo),
      valorTextoAdminConfiguracoes(appMetadata.tipo_usuario),
      ...roles,
    ].some((valor) => cargosPermitidos.has(valor)) ||
    appMetadata.admin === true ||
    appMetadata.is_admin === true ||
    appMetadata.moderator === true
  );
}

export function obterIniciais(nome: string, email: string) {
  const base = nome.trim() || email.trim() || "Historietas";
  const partes = base
    .replace(/@.*/, "")
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length >= 2) {
    return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
  }

  return (partes[0] || "H").slice(0, 2).toUpperCase();
}
