export function criarStorageKeyUsuarioObraPublica(
  chave: string,
  userId: string,
) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

export function lerStorageUsuarioObraPublica(
  chave: string,
  userId: string,
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return null;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioObraPublica(chave, userIdLimpo);

    return chaveStorage ? localStorage.getItem(chaveStorage) : null;
  } catch {
    return null;
  }
}

export function salvarStorageUsuarioObraPublica(
  chave: string,
  userId: string,
  valor: unknown,
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioObraPublica(chave, userIdLimpo);

    if (!chaveStorage) {
      return;
    }

    localStorage.setItem(chaveStorage, JSON.stringify(valor));
  } catch {
    // localStorage é fallback; a página continua com o estado em memória.
  }
}

export function carregarListaLocalObraPublica(
  chaveStorage: string,
  userId = "",
) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [] as string[];
  }

  try {
    const texto = lerStorageUsuarioObraPublica(chaveStorage, userIdLimpo);
    const json: unknown = texto ? JSON.parse(texto) : [];

    return Array.isArray(json)
      ? json.filter(
          (item): item is string =>
            typeof item === "string" && Boolean(item.trim()),
        )
      : [];
  } catch {
    return [] as string[];
  }
}
