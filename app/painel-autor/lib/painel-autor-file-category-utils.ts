export function normalizarCategoriaArquivoSupabase(
  categoria: string | null,
  tipo: string | null
): "texto" | "documento" | "imagem" | "outro" {
  if (
    categoria === "texto" ||
    categoria === "documento" ||
    categoria === "imagem" ||
    categoria === "outro"
  ) {
    return categoria;
  }

  const tipoNormalizado = (tipo || "").toLowerCase();

  if (tipoNormalizado.startsWith("image/")) {
    return "imagem";
  }

  if (
    tipoNormalizado.includes("pdf") ||
    tipoNormalizado.includes("document") ||
    tipoNormalizado.includes("word")
  ) {
    return "documento";
  }

  if (tipoNormalizado.startsWith("text/") || tipoNormalizado.includes("markdown")) {
    return "texto";
  }

  return "outro";
}
