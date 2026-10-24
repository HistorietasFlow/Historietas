import { normalizarTexto } from "../../../lib/utils";
import { textoPersonalizadoValido } from "./editar-obra-custom-value-utils";

type CalcularValoresDerivadosFormularioEdicaoObraParams = {
  formato: string;
  genero: string;
  tagPersonalizada: string;
  usarTagPersonalizada: boolean;
  formatoPersonalizado: string;
  generoPersonalizado: string;
  outroFormatoValue: string;
  outroGeneroValue: string;
  limiteCaracteresFormatoGeneroPersonalizado: number;
  limiteCaracteresTagPersonalizada: number;
};

export function calcularValoresDerivadosFormularioEdicaoObra({
  formato,
  genero,
  tagPersonalizada,
  usarTagPersonalizada,
  formatoPersonalizado,
  generoPersonalizado,
  outroFormatoValue,
  outroGeneroValue,
  limiteCaracteresFormatoGeneroPersonalizado,
  limiteCaracteresTagPersonalizada,
}: CalcularValoresDerivadosFormularioEdicaoObraParams) {
  const formatoEhPersonalizado = formato === outroFormatoValue;
  const generoEhPersonalizado = genero === outroGeneroValue;
  const formatoFinal = formatoEhPersonalizado
    ? formatoPersonalizado.trim().replace(/\s+/g, " ")
    : formato.trim();
  const generoFinal = generoEhPersonalizado
    ? generoPersonalizado.trim().replace(/\s+/g, " ")
    : genero.trim();
  const tagPersonalizadaFinal = tagPersonalizada.trim().replace(/\s+/g, " ");
  const formatoPersonalizadoValido =
    !formatoEhPersonalizado ||
    textoPersonalizadoValido(
      formatoPersonalizado,
      3,
      limiteCaracteresFormatoGeneroPersonalizado,
    );
  const generoPersonalizadoValido =
    !generoEhPersonalizado ||
    textoPersonalizadoValido(
      generoPersonalizado,
      3,
      limiteCaracteresFormatoGeneroPersonalizado,
    );
  const tagPersonalizadaValida =
    !usarTagPersonalizada ||
    (textoPersonalizadoValido(
      tagPersonalizada,
      2,
      limiteCaracteresTagPersonalizada,
    ) &&
      normalizarTexto(tagPersonalizadaFinal) !== normalizarTexto(formatoFinal) &&
      normalizarTexto(tagPersonalizadaFinal) !== normalizarTexto(generoFinal));

  return {
    formatoEhPersonalizado,
    generoEhPersonalizado,
    formatoFinal,
    generoFinal,
    tagPersonalizadaFinal,
    formatoPersonalizadoValido,
    generoPersonalizadoValido,
    tagPersonalizadaValida,
  };
}
