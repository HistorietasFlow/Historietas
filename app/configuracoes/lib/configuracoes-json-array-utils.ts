export function carregarJsonArrayConfiguracoes(
  chave: string,
  userId: string,
  lerStorage: (chave: string, userId: string) => string | null,
) {
  try {
    const texto = lerStorage(chave, userId);
    const json: unknown = texto ? JSON.parse(texto) : [];

    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}
