export const STORAGE_KEY = "historietas-obras";
export const FOLLOW_STORAGE_KEY = "historietas-obras-seguidas";
export const AUTHOR_FOLLOW_STORAGE_KEY = "historietas-autores-seguidos";
export const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
export const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";

export function criarStorageKeyUsuarioSeguindo(
  chave: string,
  userId: string,
) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

export function lerJsonStorageUsuarioSeguindo(
  chave: string,
  userId: string,
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return null;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioSeguindo(chave, userIdLimpo);
    const texto = chaveStorage ? localStorage.getItem(chaveStorage) : null;

    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}

export function salvarJsonStorageUsuarioSeguindo(
  chave: string,
  userId: string,
  valor: unknown,
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioSeguindo(chave, userIdLimpo);

    if (!chaveStorage) {
      return;
    }

    localStorage.setItem(chaveStorage, JSON.stringify(valor));
  } catch {
    // localStorage é apoio; a página continua com o estado em memória.
  }
}
