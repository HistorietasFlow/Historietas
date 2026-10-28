export const SAVED_RELEASES_STORAGE_KEY = "historietas-lancamentos-salvos";

function criarStorageKeyUsuarioEmBreve(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

export function carregarJsonUsuarioEmBreve(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return null;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioEmBreve(chave, userIdLimpo);

    if (!chaveStorage) {
      return null;
    }

    const texto = localStorage.getItem(chaveStorage);

    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}

export function salvarJsonUsuarioEmBreve(
  chave: string,
  userId: string,
  valor: unknown
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioEmBreve(chave, userIdLimpo);

    if (!chaveStorage) {
      return;
    }

    localStorage.setItem(chaveStorage, JSON.stringify(valor));
  } catch {
    // localStorage é fallback; a tela continua com estado em memória.
  }
}
