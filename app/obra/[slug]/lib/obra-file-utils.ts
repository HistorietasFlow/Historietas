export function decodificarCaminhoArquivoObra(caminho: string) {
  try {
    return decodeURIComponent(caminho);
  } catch {
    return caminho;
  }
}

export function normalizarCategoriaArquivoSupabase(categoria: string | null) {
  if (
    categoria === "texto" ||
    categoria === "documento" ||
    categoria === "imagem" ||
    categoria === "outro"
  ) {
    return categoria;
  }

  return "outro";
}
