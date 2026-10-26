type ObraComAutorId = { autorId?: string };

export function normalizarUsuarioId(userId: string) {
  return userId.trim().toLowerCase();
}

export function obraPertenceAoUsuario(obra: ObraComAutorId, userId: string) {
  const usuarioIdNormalizado = normalizarUsuarioId(userId);
  const autorIdNormalizado = normalizarUsuarioId(obra.autorId || "");

  return Boolean(usuarioIdNormalizado && autorIdNormalizado === usuarioIdNormalizado);
}

export function filtrarObrasDoUsuario<T extends ObraComAutorId>(obrasParaFiltrar: T[], userId: string): T[] {
  return obrasParaFiltrar.filter((obra) => obraPertenceAoUsuario(obra, userId));
}

export function atualizarObrasLocaisDoUsuario<T extends ObraComAutorId & { id: string }>(obrasLocaisAtuais: T[], obrasDoUsuario: T[], userId: string): T[] {
  const idsObrasDoUsuario = new Set(obrasDoUsuario.map((obra) => obra.id));
  const outrasObrasLocais = obrasLocaisAtuais.filter((obra) => {
    if (idsObrasDoUsuario.has(obra.id)) return false;
    return !obraPertenceAoUsuario(obra, userId);
  });
  return [...obrasDoUsuario, ...outrasObrasLocais];
}
