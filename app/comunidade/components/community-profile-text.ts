import type { PerfilComunidadeRow } from "./community-supabase-profile-row";

export function obterTextoProfileComunidade(
  profile: PerfilComunidadeRow | undefined,
  chave: string
) {
  if (!profile) {
    return "";
  }

  const valor = profile[chave];

  if (typeof valor === "string") {
    return valor.trim();
  }

  if (typeof valor === "number" || typeof valor === "boolean") {
    return String(valor);
  }

  return "";
}
