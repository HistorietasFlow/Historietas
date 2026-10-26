type ObraComAutorAdicionarCapitulo = {
  autor: string;
  autorId?: string;
};

export function obterTextoProfileAdicionarCapitulo(valor: unknown) {
  return typeof valor === "string" && valor.trim() ? valor.trim() : "";
}

export function aplicarAutorProfileAdicionarCapitulo<
  T extends ObraComAutorAdicionarCapitulo,
>(
  obrasParaAtualizar: T[],
  userId: string,
  nomeProfile: string
): T[] {
  const nomeAutor = nomeProfile.trim();
  const usuarioId = userId.trim();

  if (!nomeAutor || !usuarioId) {
    return obrasParaAtualizar;
  }

  return obrasParaAtualizar.map((obra) => {
    const autorId = obra.autorId?.trim() || usuarioId;

    if (autorId !== usuarioId) {
      return obra;
    }

    return {
      ...obra,
      autor: nomeAutor,
      autorId,
    };
  });
}
