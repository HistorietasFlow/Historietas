type CapituloLeituraHome = {
  id: string;
  criadoEm: string;
  lido: boolean;
  lidoEm: string;
};

type ObraLeituraHome = {
  capitulos: CapituloLeituraHome[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
};

export function calcularProgressoLeitura(capitulos: CapituloLeituraHome[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
}

export function encontrarCapituloParaContinuar(obra: ObraLeituraHome) {
  const temCapituloLido = obra.capitulos.some((capitulo) => capitulo.lido);

  if (!temCapituloLido) {
    return null;
  }

  const indiceUltimoCapituloLido = obra.ultimoCapituloLidoId
    ? obra.capitulos.findIndex(
        (capitulo) => capitulo.id === obra.ultimoCapituloLidoId
      )
    : -1;

  if (indiceUltimoCapituloLido >= 0) {
    const proximoCapituloNaoLido = obra.capitulos
      .slice(indiceUltimoCapituloLido + 1)
      .find((capitulo) => !capitulo.lido);

    if (proximoCapituloNaoLido) {
      return proximoCapituloNaoLido;
    }
  }

  return obra.capitulos.find((capitulo) => !capitulo.lido) || null;
}

export function obterTempoUltimaLeitura(obra: ObraLeituraHome) {
  const temposLeitura = [
    obra.ultimaLeituraEm,
    ...obra.capitulos
      .filter((capitulo) => capitulo.lido)
      .map((capitulo) => capitulo.lidoEm),
  ].map((dataLeitura) => {
    const tempo = new Date(dataLeitura).getTime();

    return Number.isNaN(tempo) ? 0 : tempo;
  });

  return Math.max(0, ...temposLeitura);
}

export function obterTempoUltimoCapitulo(obra: ObraLeituraHome) {
  const ultimoCapitulo = obra.capitulos[obra.capitulos.length - 1] || null;
  const dataReferencia = ultimoCapitulo?.criadoEm || obra.criadaEm;
  const tempo = new Date(dataReferencia).getTime();

  return Number.isNaN(tempo) ? 0 : tempo;
}
