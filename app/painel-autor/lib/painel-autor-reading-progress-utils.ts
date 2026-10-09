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
