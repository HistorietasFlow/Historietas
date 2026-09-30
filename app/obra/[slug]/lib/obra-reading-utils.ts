type CapituloComEstadoLeitura = {
  lido: boolean;
};

export function calcularProgressoLeitura(
  capitulos: CapituloComEstadoLeitura[],
) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
}

type CapituloParaContinuarLeitura = {
  id: string;
  disponivel: boolean;
  lido: boolean;
};

type ObraParaContinuarLeitura<TCapitulo extends CapituloParaContinuarLeitura> = {
  capitulos: TCapitulo[];
  ultimoCapituloLidoId: string;
};

export function encontrarCapituloParaContinuarObraPublica<
  TCapitulo extends CapituloParaContinuarLeitura,
>(obra: ObraParaContinuarLeitura<TCapitulo>) {
  const capitulosDisponiveis = obra.capitulos.filter(
    (capitulo) => capitulo.disponivel
  );

  if (capitulosDisponiveis.length === 0) {
    return null;
  }

  const indiceUltimoCapituloLido = obra.ultimoCapituloLidoId
    ? capitulosDisponiveis.findIndex(
        (capitulo) => capitulo.id === obra.ultimoCapituloLidoId
      )
    : -1;

  if (indiceUltimoCapituloLido >= 0) {
    const proximoCapituloNaoLido = capitulosDisponiveis
      .slice(indiceUltimoCapituloLido + 1)
      .find((capitulo) => !capitulo.lido);

    if (proximoCapituloNaoLido) {
      return proximoCapituloNaoLido;
    }
  }

  return (
    capitulosDisponiveis.find((capitulo) => !capitulo.lido) ||
    capitulosDisponiveis[capitulosDisponiveis.length - 1]
  );
}
