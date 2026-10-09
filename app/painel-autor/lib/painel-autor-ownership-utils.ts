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
