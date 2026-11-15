export function criarStorageKeyUsuarioEditarObra(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

export function lerStorageUsuarioEditarObra(chave: string, userId: string, estrito = false) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return null;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioEditarObra(chave, userIdLimpo);

    return chaveStorage ? localStorage.getItem(chaveStorage) : null;
  } catch (error) {
    if (estrito) throw error;
    return null;
  }
}

export function salvarJsonStorageUsuarioEditarObra(
  chave: string,
  userId: string,
  valor: unknown,
  estrito = false,
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioEditarObra(chave, userIdLimpo);

    if (!chaveStorage) {
      return;
    }

    localStorage.setItem(chaveStorage, JSON.stringify(valor));
  } catch (error) {
    if (estrito) throw error;
    // localStorage é fallback; a edição continua com o estado em memória.
  }
}
