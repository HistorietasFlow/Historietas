export function contarLetrasNumeros(texto: string) {
  return texto.match(/[\p{L}\p{N}]/gu)?.length || 0;
}

export function contarPalavras(texto: string) {
  return texto.trim().split(/\s+/).filter(Boolean).length;
}

export function criarTituloPorNomeArquivo(nomeArquivo: string) {
  return nomeArquivo
    .replace(/\.(txt|md)$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
