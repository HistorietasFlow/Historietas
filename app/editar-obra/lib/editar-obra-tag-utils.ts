import {
  limparTextoPersonalizado,
  textoPersonalizadoValido,
} from "./editar-obra-custom-value-utils";

export function prepararAtualizacaoTagPersonalizada(
  valor: string,
  limiteCaracteres: number,
) {
  const tagPersonalizada = limparTextoPersonalizado(valor, limiteCaracteres);

  return {
    tagPersonalizada,
    tags: textoPersonalizadoValido(tagPersonalizada, 2, limiteCaracteres)
      ? tagPersonalizada.trim().replace(/\s+/g, " ")
      : "",
  };
}

export function prepararSelecaoTagEdicaoObra(
  tag: string,
  tagPersonalizada: string,
  outraTagValue: string,
  limiteCaracteres: number,
) {
  if (!tag) {
    return {
      usarTagPersonalizada: false,
      tagPersonalizada: "",
      tags: "",
    };
  }

  if (tag === outraTagValue) {
    return {
      usarTagPersonalizada: true,
      tags: textoPersonalizadoValido(tagPersonalizada, 2, limiteCaracteres)
        ? tagPersonalizada.trim().replace(/\s+/g, " ")
        : "",
    };
  }

  return {
    usarTagPersonalizada: false,
    tagPersonalizada: "",
    tags: tag,
  };
}
