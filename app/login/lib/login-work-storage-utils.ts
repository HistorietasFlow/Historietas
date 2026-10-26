export function normalizarObrasStorageLogin(valor: unknown) {
  return Array.isArray(valor)
    ? valor.filter((obra): obra is Record<string, unknown> => {
        return Boolean(obra && typeof obra === "object" && !Array.isArray(obra));
      })
    : ([] as Record<string, unknown>[]);
}

export function obterTextoRegistroLogin(
  registro: Record<string, unknown>,
  campo: string,
) {
  const valor = registro[campo];

  return typeof valor === "string" ? valor.trim() : "";
}

export function obterAutorIdObraLogin(obra: Record<string, unknown>) {
  return (
    obterTextoRegistroLogin(obra, "autorId") ||
    obterTextoRegistroLogin(obra, "user_id") ||
    obterTextoRegistroLogin(obra, "userId") ||
    obterTextoRegistroLogin(obra, "autor_id")
  );
}

export function obraPertenceAoUsuarioLogin(
  obra: Record<string, unknown>,
  userId: string,
) {
  const userIdLimpo = userId.trim();
  const autorId = obterAutorIdObraLogin(obra);

  return Boolean(userIdLimpo && autorId && autorId === userIdLimpo);
}
