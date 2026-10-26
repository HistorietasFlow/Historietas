type CapituloComOrdem = {
  ordem?: number;
};

type CapituloOrdenavel = CapituloComOrdem & {
  criadoEm: string;
};

export function obterOrdemCapitulo(
  capitulo: CapituloComOrdem,
  fallback: number,
) {
  return typeof capitulo.ordem === "number" &&
    Number.isInteger(capitulo.ordem) &&
    capitulo.ordem >= 1
    ? capitulo.ordem
    : Math.max(1, fallback);
}

export function obterProximaOrdemCapitulo(
  capitulos: CapituloComOrdem[],
) {
  const maiorOrdem = capitulos.reduce((maior, capitulo, index) => {
    return Math.max(maior, obterOrdemCapitulo(capitulo, index + 1));
  }, 0);

  return maiorOrdem + 1;
}

export function ordenarCapitulosPorOrdem<T extends CapituloOrdenavel>(
  capitulos: T[],
) {
  return [...capitulos].sort((capituloA, capituloB) => {
    const ordemA = obterOrdemCapitulo(capituloA, Number.MAX_SAFE_INTEGER);
    const ordemB = obterOrdemCapitulo(capituloB, Number.MAX_SAFE_INTEGER);

    if (ordemA !== ordemB) {
      return ordemA - ordemB;
    }

    return capituloA.criadoEm.localeCompare(capituloB.criadoEm);
  });
}
