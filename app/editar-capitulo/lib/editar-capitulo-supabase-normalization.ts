type CategoriaArquivoObra =
  | "texto"
  | "documento"
  | "imagem"
  | "outro";

export function normalizarTagsSupabase(tags: unknown) {
  if (!Array.isArray(tags)) {
    return ["sem tags"];
  }

  const tagsValidas = tags
    .filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim()))
    .map((tag) => tag.trim());

  return tagsValidas.length > 0 ? tagsValidas : ["sem tags"];
}

export function normalizarCategoriaArquivoSupabase(
  categoria: string | null | undefined,
): CategoriaArquivoObra {
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
