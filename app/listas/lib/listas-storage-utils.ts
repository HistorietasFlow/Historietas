export function criarStorageKeyUsuarioListas(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

export function normalizarListaIdsListas(valor: unknown) {
  return Array.isArray(valor)
    ? valor.filter(
        (id): id is string => typeof id === "string" && Boolean(id.trim()),
      )
    : [];
}

export function carregarListaIdsListas(chave: string, userId = "") {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return [] as string[];
  }

  try {
    const chaveParaLer = criarStorageKeyUsuarioListas(chave, userIdLimpo);
    const listaTexto = localStorage.getItem(chaveParaLer);
    const lista = normalizarListaIdsListas(
      listaTexto ? JSON.parse(listaTexto) : [],
    );

    return Array.from(new Set(lista));
  } catch {
    return [] as string[];
  }
}

export function salvarListaIdsListas(chave: string, userId: string, lista: string[]) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    localStorage.setItem(
      criarStorageKeyUsuarioListas(chave, userIdLimpo),
      JSON.stringify(Array.from(new Set(normalizarListaIdsListas(lista)))),
    );
  } catch {
    // O estado em memória continua funcionando caso o navegador bloqueie o storage.
  }
}

export function criarLoginHrefListas() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/listas";
  const destinoSeguro =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/listas";

  return `/login?${new URLSearchParams({ redirectTo: destinoSeguro }).toString()}`;
}
