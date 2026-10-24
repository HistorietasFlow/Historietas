import { supabase } from "../../../lib/supabase/client";

export function obterTextoMetadataUsuarioEdicaoObra(
  metadata: Record<string, unknown> | null | undefined,
  chave: string
) {
  const valor = metadata?.[chave];

  return typeof valor === "string" ? valor.trim() : "";
}

function obterNomeProfileEdicaoObra(registro: unknown) {
  if (!registro || typeof registro !== "object" || Array.isArray(registro)) {
    return "";
  }

  const profile = registro as Record<string, unknown>;
  const nome = profile.nome;

  return typeof nome === "string" ? nome.trim() : "";
}

export async function carregarNomeAutorProfileEdicaoObra(
  userId: string,
  fallback = ""
) {
  const userIdLimpo = userId.trim();
  const fallbackLimpo = fallback.trim();

  if (!userIdLimpo) {
    return fallbackLimpo;
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("nome")
      .eq("user_id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (!error) {
      const nomeProfile = obterNomeProfileEdicaoObra(data);

      if (nomeProfile) {
        return nomeProfile;
      }
    }
  } catch {
    // Mantém fallback se a tabela profiles não estiver disponível.
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("nome")
      .eq("id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (!error) {
      const nomeProfile = obterNomeProfileEdicaoObra(data);

      if (nomeProfile) {
        return nomeProfile;
      }
    }
  } catch {
    // Mantém fallback se o projeto não usa id em profiles.
  }

  return fallbackLimpo;
}
