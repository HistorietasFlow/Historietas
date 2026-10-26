export const PROFILE_SYNC_FAILURE_STORAGE_KEY =
  "historietas-profile-sync-failure";

export function obterDetalhesErroPerfil(error: unknown) {
  if (!error || typeof error !== "object") {
    return typeof error === "string" && error.trim()
      ? error.trim()
      : "erro desconhecido";
  }

  const erroSupabase = error as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  };

  return [
    erroSupabase.message,
    erroSupabase.code ? `código ${erroSupabase.code}` : "",
    erroSupabase.details,
    erroSupabase.hint,
  ]
    .filter((valor): valor is string => Boolean(valor?.trim()))
    .join(" | ") || "erro desconhecido";
}

export function registrarFalhaSincronizacaoPerfil(
  error: unknown,
  userId: string,
) {
  const detalhes = obterDetalhesErroPerfil(error);

  console.error(
    "[Historietas] Falha ao sincronizar o perfil após a autenticação.",
    {
      userId,
      detalhes,
    },
  );

  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.setItem(
      PROFILE_SYNC_FAILURE_STORAGE_KEY,
      JSON.stringify({
        userId,
        detalhes,
        registradoEm: new Date().toISOString(),
      }),
    );
  } catch {
    // O registro local é apenas diagnóstico e não pode bloquear o login.
  }
}
