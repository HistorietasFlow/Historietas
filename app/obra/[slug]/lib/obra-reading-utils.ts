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
