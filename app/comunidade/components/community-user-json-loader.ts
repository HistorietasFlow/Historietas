import { criarStorageKeyUsuarioComunidade } from "./community-user-storage-key";

export type CarregarJsonUsuarioComunidade = (
  chave: string,
  userId?: string
) => unknown;

export function carregarJsonUsuarioComunidade(chave: string, userId = "") {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return null;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioComunidade(chave, userIdLimpo);

    if (!chaveStorage) {
      return null;
    }

    const texto = window.localStorage.getItem(chaveStorage);

    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}
