export function criarStorageKeyUsuarioPerfilBiblioteca(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

export function normalizarListaIdsPerfilBiblioteca(valor: unknown) {
  return Array.isArray(valor)
    ? valor.filter((id): id is string => typeof id === "string" && Boolean(id.trim()))
    : [];
}

export function carregarListaIdsPerfilBiblioteca(chave: string, userId = "") {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return [] as string[];
  }

  try {
    const chaveParaLer = criarStorageKeyUsuarioPerfilBiblioteca(chave, userIdLimpo);
    const listaTexto = localStorage.getItem(chaveParaLer);
    const lista = normalizarListaIdsPerfilBiblioteca(
      listaTexto ? JSON.parse(listaTexto) : [],
    );

    return Array.from(new Set(lista));
  } catch {
    return [] as string[];
  }
}

export function salvarListaIdsPerfilBiblioteca(
  chave: string,
  userId: string,
  lista: string[],
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  const listaNormalizada = normalizarListaIdsPerfilBiblioteca(lista);

  try {
    localStorage.setItem(
      criarStorageKeyUsuarioPerfilBiblioteca(chave, userIdLimpo),
      JSON.stringify(listaNormalizada),
    );
  } catch {
    // A Biblioteca continua funcionando em memória se o armazenamento local falhar.
  }
}

export function carregarJsonUsuarioPerfilAutor(chave: string, userId = "") {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return null;
  }

  try {
    const texto = localStorage.getItem(
      criarStorageKeyUsuarioPerfilBiblioteca(chave, userIdLimpo),
    );

    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}

export function salvarJsonUsuarioPerfilAutor(chave: string, userId: string, valor: unknown) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    localStorage.setItem(
      criarStorageKeyUsuarioPerfilBiblioteca(chave, userIdLimpo),
      JSON.stringify(valor),
    );
  } catch {
    // localStorage é apoio; a tela segue com o estado em memória.
  }
}
