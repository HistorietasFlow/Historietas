export function criarStorageKeyUsuarioConfiguracoes(
  chave: string,
  userId: string,
) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}
