import { criarStorageKeyUsuarioComunidade } from "./community-user-storage-key";

export type SalvarJsonUsuarioComunidade = (
  chave: string,
  userId: string,
  valor: unknown
) => void;

export function salvarJsonUsuarioComunidade(
  chave: string,
  userId: string,
  valor: unknown
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioComunidade(chave, userIdLimpo);

    if (!chaveStorage) {
      return;
    }

    window.localStorage.setItem(chaveStorage, JSON.stringify(valor));
  } catch {
    // localStorage é fallback; a Comunidade continua em memória.
  }
}
