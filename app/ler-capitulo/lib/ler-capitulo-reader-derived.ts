import type {
  CapituloLocal,
  ObraLocal,
} from "./ler-capitulo-work-normalization";

export function obterObraAtualLeitor(
  obras: ObraLocal[],
  obraId: string,
) {
  return obras.find((obra) => obra.id === obraId) || null;
}

export function obterCapituloAtualLeitor(
  obraAtual: ObraLocal | null,
  capituloId: string,
) {
  return obraAtual?.capitulos.find((capitulo) => capitulo.id === capituloId) || null;
}

export function obterIndiceCapituloLeitor(
  obraAtual: ObraLocal | null,
  capituloAtual: CapituloLocal | null,
) {
  if (!obraAtual || !capituloAtual) {
    return -1;
  }

  return obraAtual.capitulos.findIndex(
    (capitulo) => capitulo.id === capituloAtual.id,
  );
}

export function obterNumeroCapituloLeitor(indiceCapitulo: number) {
  return indiceCapitulo >= 0 ? indiceCapitulo + 1 : 1;
}

export function obterCapituloAnteriorLeitor(
  obraAtual: ObraLocal | null,
  indiceCapitulo: number,
) {
  if (!obraAtual || indiceCapitulo <= 0) {
    return null;
  }

  return obraAtual.capitulos[indiceCapitulo - 1] || null;
}

export function obterProximoCapituloLeitor(
  obraAtual: ObraLocal | null,
  indiceCapitulo: number,
) {
  if (!obraAtual || indiceCapitulo < 0) {
    return null;
  }

  return obraAtual.capitulos[indiceCapitulo + 1] || null;
}
