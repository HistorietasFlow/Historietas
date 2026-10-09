export function normalizarListaIds(valor: unknown): string[] {
  if (!Array.isArray(valor)) {
    return [];
  }

  return Array.from(
    new Set(
      valor
        .filter((id): id is string => typeof id === "string")
        .map((id) => id.trim())
        .filter(Boolean)
    )
  );
}

export function criarStorageKeyUsuarioPainel(chave: string, userId: string) {
  const usuarioId = userId.trim();

  return usuarioId ? `${chave}:${usuarioId}` : "";
}

export function lerStorageUsuarioPainel(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return null;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioPainel(chave, userIdLimpo);

    return chaveStorage ? localStorage.getItem(chaveStorage) : null;
  } catch {
    return null;
  }
}

export function salvarJsonStorageUsuarioPainel(
  chave: string,
  userId: string,
  valor: unknown
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioPainel(chave, userIdLimpo);

    if (!chaveStorage) {
      return;
    }

    localStorage.setItem(chaveStorage, JSON.stringify(valor));
  } catch {
    // localStorage é fallback; o painel continua com estado em memória.
  }
}

export function carregarListaIdsPainel(chave: string, userId: string) {
  try {
    const listaUsuarioTexto = lerStorageUsuarioPainel(chave, userId);
    const listaUsuarioJson: unknown = listaUsuarioTexto
      ? JSON.parse(listaUsuarioTexto)
      : [];

    return normalizarListaIds(listaUsuarioJson);
  } catch {
    return [] as string[];
  }
}

export function salvarListaIdsUsuarioPainel(
  chave: string,
  userId: string,
  listaUsuario: string[]
) {
  if (!userId.trim()) {
    return;
  }

  const listaUsuarioNormalizada = normalizarListaIds(listaUsuario);

  salvarJsonStorageUsuarioPainel(chave, userId, listaUsuarioNormalizada);
}

export function lerListaIdsStoragePainel(chave: string, userId = "") {
  try {
    const listaTexto = lerStorageUsuarioPainel(chave, userId);
    const listaJson: unknown = listaTexto ? JSON.parse(listaTexto) : [];

    return normalizarListaIds(listaJson);
  } catch {
    return [] as string[];
  }
}

export function salvarColecaoAposExcluirPainel(
  chave: string,
  userId: string,
  listaUsuario: string[]
) {
  if (!userId.trim()) {
    return;
  }

  salvarJsonStorageUsuarioPainel(
    chave,
    userId,
    normalizarListaIds(listaUsuario)
  );
}
