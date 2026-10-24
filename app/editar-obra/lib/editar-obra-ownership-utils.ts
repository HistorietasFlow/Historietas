type ObraComAutorLocal = {
  autorId?: string;
};

export function normalizarIdUsuario(valor: string) {
  return valor.trim().toLowerCase();
}

export function usuarioPodeEditarObraLocal(
  obra: ObraComAutorLocal,
  userId: string
) {
  const usuarioAtual = normalizarIdUsuario(userId);
  const autorIdObra = normalizarIdUsuario(obra.autorId || "");

  return Boolean(usuarioAtual) && (!autorIdObra || autorIdObra === usuarioAtual);
}
