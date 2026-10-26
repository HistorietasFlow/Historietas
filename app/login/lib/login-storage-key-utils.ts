export const STORAGE_KEY = "historietas-obras";

export function criarStorageUsuarioLoginKey(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

export function criarStorageObrasUsuarioLoginKey(userId: string) {
  return criarStorageUsuarioLoginKey(STORAGE_KEY, userId);
}
