export const CHAVE_OBRAS = "historietas-obras";
export const CHAVE_NOTIFICACOES = "historietas-notificacoes";
export const CHAVE_OBRAS_SEGUIDAS = "historietas-obras-seguidas";
export const CHAVE_NOTIFICACOES_APAGADAS = "historietas-notificacoes-apagadas";

export function criarStorageKeyUsuarioNotificacoes(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

export function lerStorageUsuarioNotificacoes(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return null;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioNotificacoes(chave, userIdLimpo);

    return chaveStorage ? localStorage.getItem(chaveStorage) : null;
  } catch {
    return null;
  }
}

export function salvarJsonStorageUsuarioNotificacoes(
  chave: string,
  userId: string,
  valor: unknown
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioNotificacoes(chave, userIdLimpo);

    if (!chaveStorage) {
      return;
    }

    localStorage.setItem(chaveStorage, JSON.stringify(valor));
  } catch {
    // localStorage é fallback; as notificações continuam em memória.
  }
}
