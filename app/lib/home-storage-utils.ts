import { normalizarListaIdsHome } from "./home-collection-utils";

export function criarStorageKeyUsuarioHome(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

export function lerStorageUsuarioHome(chave: string, userId = "", aoFalhar?: () => void) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return null;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioHome(chave, userIdLimpo);

    return chaveStorage ? localStorage.getItem(chaveStorage) : null;
  } catch {
    aoFalhar?.();
    return null;
  }
}

export function salvarJsonStorageUsuarioHome(
  chave: string,
  userId: string,
  valor: unknown
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioHome(chave, userIdLimpo);

    if (!chaveStorage) {
      return;
    }

    localStorage.setItem(chaveStorage, JSON.stringify(valor));
  } catch {
    // A Home continua funcionando mesmo se o navegador bloquear o localStorage.
  }
}

export function carregarListaIdsHome(chave: string, userId: string, fallback: string[] = [], aoFalhar?: () => void) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return [] as string[];
  }

  try {
    const listaTexto = lerStorageUsuarioHome(chave, userIdLimpo, aoFalhar);
    const listaJson: unknown = listaTexto ? JSON.parse(listaTexto) : [];
    if (!Array.isArray(listaJson)) throw new Error("Storage de coleção inválido");
    const listaSalva = Array.isArray(listaJson)
      ? listaJson.filter((id): id is string => typeof id === "string")
      : [];

    return normalizarListaIdsHome([...fallback, ...listaSalva]);
  } catch {
    aoFalhar?.();
    return normalizarListaIdsHome(fallback);
  }
}

export function salvarListaIdsHome(chave: string, userId: string, lista: string[]) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  const listaNormalizada = normalizarListaIdsHome(lista);

  salvarJsonStorageUsuarioHome(chave, userIdLimpo, listaNormalizada);
}
