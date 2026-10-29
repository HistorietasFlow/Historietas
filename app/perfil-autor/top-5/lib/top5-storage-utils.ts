export function criarStorageKeyUsuarioTop5(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

export function lerStorageUsuarioTop5(chave: string, userId = "") {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return null;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioTop5(chave, userIdLimpo);

    return chaveStorage ? localStorage.getItem(chaveStorage) : null;
  } catch {
    return null;
  }
}

export function salvarJsonStorageUsuarioTop5(
  chave: string,
  userId: string,
  valor: unknown,
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return false;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioTop5(chave, userIdLimpo);

    if (!chaveStorage) {
      return false;
    }

    localStorage.setItem(chaveStorage, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}
