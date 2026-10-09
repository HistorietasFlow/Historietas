export function normalizarIdUsuarioPainel(valor: string) {
  return valor.trim().toLowerCase();
}

export function obraPertenceAoUsuarioPainel(
  obra: { autorId?: string },
  userId: string
) {
  const autorIdObra = normalizarIdUsuarioPainel(obra.autorId || "");
  const usuarioId = normalizarIdUsuarioPainel(userId);

  return Boolean(usuarioId && autorIdObra && autorIdObra === usuarioId);
}

export function filtrarObrasDoUsuarioPainel<T extends { autorId?: string }>(
  obras: T[],
  userId: string
) {
  if (!userId.trim()) {
    return [] as T[];
  }

  return obras.filter((obra) => obraPertenceAoUsuarioPainel(obra, userId));
}

export function marcarObrasComDonoPainel<T extends { autorId?: string }>(
  obras: T[],
  userId: string
) {
  const usuarioId = userId.trim();

  if (!usuarioId) {
    return [] as T[];
  }

  return obras.map((obra) => ({
    ...obra,
    autorId: obra.autorId?.trim() || usuarioId,
  }));
}
