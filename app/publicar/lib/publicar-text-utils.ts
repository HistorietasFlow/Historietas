export function contarCaracteresValidos(texto: string) {
  return texto.match(/[\p{L}\p{N}]/gu)?.length || 0;
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

  if (contarCaracteresValidos(textoLimpo) < minimo) {
    return false;
  }

  return /^[\p{L}\p{N}][\p{L}\p{N}\s-]*$/u.test(textoLimpo);
}


export function campoValido(texto: string, minimo: number) {
  return contarCaracteresValidos(texto.trim()) >= minimo;
}

export function contarPalavras(texto: string) {
  return texto.trim().split(/\s+/).filter(Boolean).length;
}

export function calcularMinutosLeitura(texto: string) {
  const palavras = contarPalavras(texto);

  return palavras > 0 ? Math.max(1, Math.ceil(palavras / 220)) : 0;
}

export function nomeArquivoParaTitulo(nomeArquivo: string) {
  return nomeArquivo
    .replace(/\.(txt|md)$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
