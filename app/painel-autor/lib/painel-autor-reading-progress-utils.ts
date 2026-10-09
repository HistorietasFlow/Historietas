type CapituloPublicavelPainel = {
  publicado?: boolean;
};

type CapituloComLeituraPainel = CapituloPublicavelPainel & {
  lido: boolean;
};

export function obterCapitulosPublicadosPainel<
  TCapitulo extends CapituloPublicavelPainel,
>(capitulos: TCapitulo[]) {
  return capitulos.filter((capitulo) => capitulo.publicado !== false);
}

export function calcularProgressoLeitura<
  TCapitulo extends CapituloComLeituraPainel,
>(capitulos: TCapitulo[]) {
  const capitulosPublicados = obterCapitulosPublicadosPainel(capitulos);

  if (capitulosPublicados.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulosPublicados.filter(
    (capitulo) => capitulo.lido
  ).length;

  return Math.round((capitulosLidos / capitulosPublicados.length) * 100);
}

export function encontrarCapituloParaContinuar<
  TCapitulo extends CapituloComLeituraPainel & { id: string },
>(obra: { capitulos: TCapitulo[]; ultimoCapituloLidoId: string }) {
  const capitulosPublicados = obterCapitulosPublicadosPainel(obra.capitulos);
  const temCapituloLido = capitulosPublicados.some(
    (capitulo) => capitulo.lido
  );

  if (!temCapituloLido) {
    return null;
  }

  const indiceUltimoCapituloLido = obra.ultimoCapituloLidoId
    ? capitulosPublicados.findIndex(
        (capitulo) => capitulo.id === obra.ultimoCapituloLidoId
      )
    : -1;

  if (indiceUltimoCapituloLido >= 0) {
    const proximoCapituloNaoLido = capitulosPublicados
      .slice(indiceUltimoCapituloLido + 1)
      .find((capitulo) => !capitulo.lido);

    if (proximoCapituloNaoLido) {
      return proximoCapituloNaoLido;
    }
  }

  return (
    capitulosPublicados.find((capitulo) => !capitulo.lido) ||
    capitulosPublicados[capitulosPublicados.length - 1] ||
    null
  );
}
