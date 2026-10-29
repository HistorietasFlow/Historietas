import {
  lerStorageUsuarioTop5,
  salvarJsonStorageUsuarioTop5,
} from "./top5-storage-utils";

const TOP_FIVE_STORAGE_KEY = "historietas-top-5-obras";
export const TOP_FIVE_MAXIMO = 5;

export function carregarTop5Salvo(userId: string) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return [] as string[];
  }

  try {
    const texto = lerStorageUsuarioTop5(TOP_FIVE_STORAGE_KEY, userIdLimpo);
    const ids = texto ? JSON.parse(texto) : [];

    if (!Array.isArray(ids)) {
      return [] as string[];
    }

    return Array.from(
      new Set(
        ids
          .filter(
            (id): id is string =>
              typeof id === "string" && Boolean(id.trim()),
          )
          .map((id) => id.trim()),
      ),
    ).slice(0, TOP_FIVE_MAXIMO);
  } catch {
    return [] as string[];
  }
}

export function salvarTop5(userId: string, ids: string[]) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return false;
  }

  return salvarJsonStorageUsuarioTop5(
    TOP_FIVE_STORAGE_KEY,
    userIdLimpo,
    ids.slice(0, TOP_FIVE_MAXIMO),
  );
}
