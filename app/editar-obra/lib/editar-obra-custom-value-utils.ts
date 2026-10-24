import { normalizarTexto } from "../../../lib/utils";

export function contarLetrasNumeros(texto: string) {
  return (texto.match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9]/g) || []).length;
}

export function opcaoExiste(opcoes: readonly string[], valor: string) {
  return opcoes.some((opcao) => normalizarTexto(opcao) === normalizarTexto(valor));
}

export function limparTextoPersonalizado(texto: string, limite: number) {
  return texto
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, " ")
    .trimStart()
    .slice(0, limite);
}

export function textoPersonalizadoValido(texto: string, minimo: number, limite: number) {
  const textoLimpo = texto.trim().replace(/\s+/g, " ");

  if (textoLimpo.length > limite) {
    return false;
  }

  if (contarLetrasNumeros(textoLimpo) < minimo) {
    return false;
  }

  return /^[\p{L}\p{N}][\p{L}\p{N}\s-]*$/u.test(textoLimpo);
}

export function prepararValorEditavel(
  valor: string,
  opcoes: readonly string[],
  outroValue: string,
  limite: number
) {
  const valorLimpo = valor.trim();

  if (!valorLimpo || valorLimpo === "Não informado" || valorLimpo === "Não informada") {
    return {
      selecionado: "",
      personalizado: "",
    };
  }

  if (opcaoExiste(opcoes, valorLimpo)) {
    return {
      selecionado: valorLimpo,
      personalizado: "",
    };
  }

  return {
    selecionado: outroValue,
    personalizado: limparTextoPersonalizado(valorLimpo, limite).trim(),
  };
}
