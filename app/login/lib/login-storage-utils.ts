export function normalizarListaStringsLogin(valor: unknown) {
  return Array.isArray(valor)
    ? valor
        .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
        .map((item) => item.trim())
    : [];
}

export function lerJsonStorageLogin(chave: string): unknown {
  const chaveLimpa = chave.trim();

  if (typeof window === "undefined" || !chaveLimpa) {
    return null;
  }

  try {
    const texto = localStorage.getItem(chaveLimpa);

    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}

export function salvarJsonStorageLogin(chave: string, valor: unknown) {
  const chaveLimpa = chave.trim();

  if (typeof window === "undefined" || !chaveLimpa) {
    return;
  }

  try {
    localStorage.setItem(chaveLimpa, JSON.stringify(valor));
  } catch {
    // localStorage é apoio. O login não deve falhar por causa dele.
  }
}
